"""Keep elasticity blocks intact during free-node extraction and scaling."""
import numpy as np
from scipy.sparse import bsr_matrix

def free_blocks(matrix,keep):
    if matrix.blocksize!=(3,3):raise ValueError('Expected three-dimensional elasticity blocks.')
    keep=np.asarray(keep,dtype=bool);mapping=np.full(len(keep),-1,dtype=np.int32)
    mapping[keep]=np.arange(np.count_nonzero(keep),dtype=np.int32)
    rows=np.repeat(np.arange(len(keep),dtype=np.int32),np.diff(matrix.indptr))
    selected=keep[rows]&keep[matrix.indices]
    counts=np.bincount(mapping[rows[selected]],minlength=np.count_nonzero(keep))
    indptr=np.r_[0,np.cumsum(counts)].astype(np.int32)
    return bsr_matrix((matrix.data[selected],mapping[matrix.indices[selected]],indptr),shape=(np.count_nonzero(keep)*3,)*2)

def symmetric_scale_inplace(matrix,scaling):
    values=np.asarray(scaling).reshape(-1,3)
    # Chunking avoids allocating another array the size of the stiffness data.
    rows=np.repeat(np.arange(len(values),dtype=np.int32),np.diff(matrix.indptr))
    for start in range(0,len(rows),32768):
        stop=min(start+32768,len(rows))
        matrix.data[start:stop]*=values[rows[start:stop],:,None]
        matrix.data[start:stop]*=values[matrix.indices[start:stop],None,:]
    return matrix
