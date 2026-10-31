"""Eliminate one-level interpolation constraints without a penalty stiffness.

u_slave = sum(weight * u_master). Bone/plate masters are independent nodes;
dependent or overlapping slave definitions are rejected rather than approximated.
"""
import numpy as np
from scipy.sparse import coo_matrix,eye,kron

def interpolation(positions,pinned,slaves,masters,weights):
    count=len(positions);slaves=np.asarray(slaves,dtype=np.int64)
    masters=np.asarray(masters,dtype=np.int64);weights=np.asarray(weights,dtype=float)
    if len(np.unique(slaves))!=len(slaves):raise ValueError('A slave node has multiple exact tie definitions.')
    if np.any(slaves<0) or np.any(slaves>=count) or np.any(masters<0) or np.any(masters>=count):raise ValueError('Exact tie nodes are outside the mesh.')
    if weights.shape!=masters.shape or len(weights)!=len(slaves) or not np.isfinite(weights).all():raise ValueError('Invalid exact tie interpolation weights.')
    if np.any(pinned[slaves]):raise ValueError('A fixed node cannot also be an exact tie slave.')
    used=weights!=0
    if np.isin(masters[used],slaves).any():raise ValueError('Dependent exact tie masters require a different elimination order.')
    if np.abs(weights.sum(axis=1)-1).max()>1e-10:raise ValueError('Exact ties do not preserve translation.')
    reproduced=np.sum(positions[masters]*weights[:,:,None],axis=1)
    if np.linalg.norm(positions[slaves]-reproduced,axis=1).max()>1e-6:raise ValueError('Exact ties do not reproduce slave positions.')
    keep=np.ones(count,dtype=bool);keep[slaves]=False;independent=np.flatnonzero(keep)
    reduced_index=np.full(count,-1,dtype=np.int64);reduced_index[independent]=np.arange(len(independent))
    rows=np.concatenate((independent,np.broadcast_to(slaves[:,None],masters.shape)[used]))
    columns=np.concatenate((np.arange(len(independent)),reduced_index[masters[used]]))
    values=np.concatenate((np.ones(len(independent)),weights[used]))
    transform=coo_matrix((values,(rows,columns)),shape=(count,len(independent))).tocsr()
    return transform,independent

def condense(matrix,positions,pinned,loads,slaves,masters,weights):
    transform,independent=interpolation(positions,pinned,slaves,masters,weights)
    vector_transform=kron(transform,eye(3,format='csr'),format='csr')
    reduced=(vector_transform.T@(matrix@vector_transform)).tobsr(blocksize=(3,3))
    reduced.sum_duplicates();reduced.sort_indices();reduced.eliminate_zeros()
    return {'matrix':reduced,'positions':positions[independent],'pinned':pinned[independent],
        'loads':transform.T@loads,'transform':transform,'independent':independent}

def warp_to_scipy(matrix):
    from scipy.sparse import bsr_matrix
    count=matrix.nnz_sync()
    return bsr_matrix((matrix.values.numpy()[:count],matrix.columns.numpy()[:count],matrix.offsets.numpy()),shape=matrix.shape)

def scipy_to_warp(matrix,device):
    import warp as wp
    from warp.sparse import bsr_from_triplets
    rows=np.repeat(np.arange(matrix.shape[0]//3,dtype=np.int32),np.diff(matrix.indptr))
    return bsr_from_triplets(matrix.shape[0]//3,matrix.shape[1]//3,wp.array(rows,dtype=wp.int32,device=device),
        wp.array(matrix.indices,dtype=wp.int32,device=device),wp.array(matrix.data,dtype=wp.mat33d,device=device))
