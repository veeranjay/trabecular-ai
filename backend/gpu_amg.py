"""GPU V-cycle preconditioner with a CPU-built smoothed aggregation hierarchy.

The equilibrium operator and all CG/V-cycle iterations remain on the selected
Warp device. PyAMG constructs the Galerkin hierarchy once on the CPU.
"""
import numpy as np
from scipy.sparse import bsr_matrix, diags
import pyamg
from pyamg.util.linalg import approximate_spectral_radius
import warp as wp
from warp.sparse import bsr_from_triplets, bsr_mv
from warp.optim.linear import LinearOperator

@wp.kernel
def scale_input(x:wp.array(dtype=wp.float64),s:wp.array(dtype=wp.float64),indices:wp.array(dtype=wp.int32),out:wp.array(dtype=wp.float64)):
    i=wp.tid();out[i]=x[indices[i]]*s[i]

@wp.kernel
def relax(x:wp.array(dtype=wp.float64),b:wp.array(dtype=wp.float64),ax:wp.array(dtype=wp.float64),inv:wp.array(dtype=wp.float64)):
    i=wp.tid();x[i]+=inv[i]*(b[i]-ax[i])

@wp.kernel
def subtract(b:wp.array(dtype=wp.float64),ax:wp.array(dtype=wp.float64),out:wp.array(dtype=wp.float64)):
    i=wp.tid();out[i]=b[i]-ax[i]

@wp.kernel
def finish(x:wp.array(dtype=wp.float64),s:wp.array(dtype=wp.float64),indices:wp.array(dtype=wp.int32),y:wp.array(dtype=wp.float64),
           z:wp.array(dtype=wp.float64),alpha:wp.float64,beta:wp.float64):
    i=wp.tid();j=indices[i];value=alpha*s[i]*x[i]
    if beta!=wp.float64(0.):value+=beta*y[j]
    z[j]=value

@wp.kernel
def identity_part(x:wp.array(dtype=wp.float64),y:wp.array(dtype=wp.float64),z:wp.array(dtype=wp.float64),alpha:wp.float64,beta:wp.float64):
    i=wp.tid();value=alpha*x[i]
    if beta!=wp.float64(0.):value+=beta*y[i]
    z[i]=value

@wp.kernel
def dense_solve(inverse:wp.array2d(dtype=wp.float64),b:wp.array(dtype=wp.float64),x:wp.array(dtype=wp.float64),n:int):
    i=wp.tid();value=wp.float64(0.)
    for j in range(n):value+=inverse[i,j]*b[j]
    x[i]=value


def scalar_view(array):
    if array.dtype==wp.float64:return array
    view=wp.array(ptr=array.ptr,shape=(array.size*3,),dtype=wp.float64,device=array.device)
    view._ref=array
    return view

def transfer(matrix,device):
    coo=matrix.tocoo()
    return bsr_from_triplets(matrix.shape[0],matrix.shape[1],wp.array(coo.row,dtype=wp.int32,device=device),
        wp.array(coo.col,dtype=wp.int32,device=device),wp.array(coo.data,dtype=wp.float64,device=device))

def build(matrix,positions,pinned):
    count=matrix.nnz_sync()
    scipy_matrix=bsr_matrix((matrix.values.numpy()[:count],matrix.columns.numpy()[:count],matrix.offsets.numpy()),shape=matrix.shape)
    from block_scaling import free_blocks,symmetric_scale_inplace
    free=np.flatnonzero(~np.repeat(pinned,3))
    scipy_matrix=free_blocks(scipy_matrix,~pinned)
    diagonal=scipy_matrix.diagonal()
    if np.any(diagonal<=0):raise ValueError('The constrained stiffness has a non-positive diagonal.')
    scaling=1/np.sqrt(diagonal)
    scaled=symmetric_scale_inplace(scipy_matrix,scaling)
    free_positions=positions[~pinned]
    centered=free_positions-free_positions.mean(axis=0)
    modes=np.zeros((len(free_positions),3,6));modes[:,:,:3]=np.eye(3)
    for axis in range(3):modes[:,:,3+axis]=np.cross(np.eye(3)[axis],centered)
    candidates=modes.reshape(-1,6)/scaling[:,None]
    hierarchy=pyamg.smoothed_aggregation_solver(scaled,B=candidates,symmetry='symmetric',
        strength=('symmetric',{'theta':0.01}),max_coarse=120,max_levels=8,
        presmoother=('jacobi',{'omega':.7,'iterations':2}),postsmoother=('jacobi',{'omega':.7,'iterations':2}))
    device=matrix.device
    levels=[]
    for i,level in enumerate(hierarchy.levels):
        a=level.A.tocsr();n=a.shape[0]
        entry={'a':transfer(a,device),'x':wp.zeros(n,dtype=wp.float64,device=device),
               'b':wp.zeros(n,dtype=wp.float64,device=device),'r':wp.zeros(n,dtype=wp.float64,device=device),
               'ax':wp.zeros(n,dtype=wp.float64,device=device)}
        if i<len(hierarchy.levels)-1:
            invdiag=np.divide(1.,a.diagonal(),out=np.zeros(n),where=np.abs(a.diagonal())>1e-20)
            spectral=approximate_spectral_radius(diags(invdiag)@a)
            entry.update(p=transfer(level.P,device),rmat=transfer(level.R,device),
                inv=wp.array((1.2/spectral)*invdiag,dtype=wp.float64,device=device))
        else:
            dense=a.toarray();inverse=np.linalg.pinv(dense,hermitian=True)
            entry['inverse']=wp.array((inverse+inverse.T)/2,dtype=wp.float64,device=device)
        levels.append(entry)
    scale=wp.array(scaling,dtype=wp.float64,device=device)
    indices=wp.array(free,dtype=wp.int32,device=device)
    previous_y=wp.zeros(matrix.shape[0],dtype=wp.float64,device=device)
    def cycle(index):
        level=levels[index];n=level['x'].size
        level['x'].zero_()
        if index==len(levels)-1:
            wp.launch(dense_solve,dim=n,inputs=[level['inverse'],level['b'],level['x'],n],device=device)
            return
        for _ in range(2):
            bsr_mv(level['a'],level['x'],level['ax'])
            wp.launch(relax,dim=n,inputs=[level['x'],level['b'],level['ax'],level['inv']],device=device)
        bsr_mv(level['a'],level['x'],level['ax'])
        wp.launch(subtract,dim=n,inputs=[level['b'],level['ax'],level['r']],device=device)
        bsr_mv(level['rmat'],level['r'],levels[index+1]['b'])
        cycle(index+1)
        bsr_mv(level['p'],levels[index+1]['x'],level['x'],alpha=1.,beta=1.)
        for _ in range(2):
            bsr_mv(level['a'],level['x'],level['ax'])
            wp.launch(relax,dim=n,inputs=[level['x'],level['b'],level['ax'],level['inv']],device=device)
    def matvec(x,y,z,alpha,beta):
        if beta!=0.:
            wp.copy(previous_y,scalar_view(y))
        wp.launch(scale_input,dim=len(scaling),inputs=[scalar_view(x),scale,indices,levels[0]['b']],device=device)
        cycle(0)
        wp.launch(identity_part,dim=x.size*3,inputs=[scalar_view(x),previous_y,scalar_view(z),wp.float64(alpha),wp.float64(beta)],device=device)
        wp.launch(finish,dim=len(scaling),inputs=[levels[0]['x'],scale,indices,previous_y,scalar_view(z),wp.float64(alpha),wp.float64(beta)],device=device)
    return LinearOperator(matrix.shape,matrix.dtype,device,matvec),[level.A.shape[0] for level in hierarchy.levels]
