"""Independent, bounded-memory audit of portable jaw fields using NumPy only.

No production assembly, shape-gradient, stress recovery or solver functions are
imported. Engineering-strain B/D matrices reconstruct the stiffness action and
point-attachment forces directly from the exported Tet4/Tet10 arrays.
"""
from __future__ import annotations
import argparse,hashlib,json,time
from pathlib import Path
import numpy as np

VERIFIER_SOURCE_SHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()

EDGE_ORDER=((0,1),(0,2),(0,3),(1,2),(1,3),(2,3))
QUADRATURE=np.full((4,4),(5-np.sqrt(5))/20)
np.fill_diagonal(QUADRATURE,(5+3*np.sqrt(5))/20)
THRESHOLDS={'free_force_relative_residual':1e-6,'force_balance_error':1e-6,
    'moment_balance_error':1e-6,'energy_work_relative_error':1e-6,
    'stress_relative_difference':1e-8,'attachment_partition_error':1e-10,
    'attachment_position_error_mm':1e-6}

def element_action(vertices,displacement,young,poisson,degree):
    """Batch element force, four stresses, strain energy and signed volume."""
    n=len(vertices);count=4 if degree==1 else 10
    affine=np.concatenate((np.ones((n,4,1)),vertices),axis=2)
    determinant=np.linalg.det(affine)
    if np.any(determinant<=0):raise ValueError('Non-positive tetrahedron in the saved calculation.')
    gradients=np.linalg.inv(affine)[:,1:,:].transpose(0,2,1)
    volume=determinant/6
    elasticity=np.zeros((n,6,6))
    mu=young/(2*(1+poisson));lam=young*poisson/((1+poisson)*(1-2*poisson))
    elasticity[:,:3,:3]=lam[:,None,None]
    for axis in range(3):elasticity[:,axis,axis]+=2*mu
    for axis in range(3,6):elasticity[:,axis,axis]=mu
    force=np.zeros((n,count*3));stress=np.zeros((n,4));energy=np.zeros(n)
    values=displacement.reshape(n,count*3)
    for q,bary in enumerate(QUADRATURE):
        if degree==1:shape=gradients
        else:
            shape=np.empty((n,10,3));shape[:,:4]=gradients*(4*bary-1)[None,:,None]
            for edge,(a,b) in enumerate(EDGE_ORDER):shape[:,4+edge]=4*(bary[a]*gradients[:,b]+bary[b]*gradients[:,a])
        bmatrix=np.zeros((n,6,count*3))
        dx,dy,dz=shape[:,:,0],shape[:,:,1],shape[:,:,2]
        bmatrix[:,0,0::3]=dx;bmatrix[:,1,1::3]=dy;bmatrix[:,2,2::3]=dz
        bmatrix[:,3,0::3]=dy;bmatrix[:,3,1::3]=dx
        bmatrix[:,4,1::3]=dz;bmatrix[:,4,2::3]=dy
        bmatrix[:,5,0::3]=dz;bmatrix[:,5,2::3]=dx
        strain=np.einsum('eij,ej->ei',bmatrix,values)
        sigma=np.einsum('eij,ej->ei',elasticity,strain)
        force+=np.einsum('eij,ei->ej',bmatrix,sigma)*volume[:,None]/4
        energy+=np.einsum('ei,ei->e',strain,sigma)*volume/8
        xx,yy,zz,xy,yz,zx=sigma.T
        stress[:,q]=np.sqrt(((xx-yy)**2+(yy-zz)**2+(zz-xx)**2)/2+3*(xy**2+yz**2+zx**2))
    return force.reshape(n,count,3),stress,energy,volume

def attachment_action(positions,u,slave,masters,weights,stiffness):
    delta=u[slave]-np.sum(u[masters]*weights[:,:,None],axis=1)
    force=stiffness[:,None]*delta
    internal=np.zeros_like(u)
    np.add.at(internal,slave,force)
    for column in range(masters.shape[1]):
        np.add.at(internal,masters[:,column],-force*weights[:,column,None])
    return internal,{'energy_n_mm':float(np.sum(stiffness*np.sum(delta**2,axis=1))/2),
        'partition_error':float(np.max(np.abs(weights.sum(axis=1)-1))),
        'position_error_mm':float(np.linalg.norm(positions[slave]-np.sum(positions[masters]*weights[:,:,None],axis=1),axis=1).max()),
        'max_slip_mm':float(np.linalg.norm(delta,axis=1).max())}

def exact_attachment_action(element_residual,positions,u,slave,masters,weights):
    """Recover constraint forces from slave equilibrium; check master equilibrium later."""
    if len(np.unique(slave))!=len(slave):raise ValueError('Duplicate exact constraints in the saved fields.')
    reaction=-element_residual[slave]
    internal=np.zeros_like(u);np.add.at(internal,slave,reaction)
    for column in range(masters.shape[1]):np.add.at(internal,masters[:,column],-reaction*weights[:,column,None])
    _,info=attachment_action(positions,u,slave,masters,weights,np.zeros(len(slave)))
    return internal,info

def audit(path,batch=1024):
    started=time.perf_counter();path=Path(path)
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    with np.load(path,allow_pickle=False) as data:
        positions=data['positions_mm'];u=data['displacement_mm'];cells=data['tetrahedra']
        connections=data['element_connectivity'];degrees=data['element_degree']
        young=data['young_modulus_mpa'];poisson=data['poisson_ratio']
        fixed=data['fixed_nodes'];loads=data['applied_nodal_force_n']
        stored_stress=data['quadrature_stress_mpa'];materials=data['material_id']
        metadata=json.loads(str(data['metadata']))
        arrays=(positions,u,loads,young,poisson,stored_stress)
        if not all(np.isfinite(a).all() for a in arrays):raise ValueError('Non-finite portable field data.')
        if set(np.unique(degrees))-{1,2}:raise ValueError('Unsupported element degree.')
        internal=np.zeros_like(u);stress_error_squared=0.;max_stress_difference=0.
        elastic_energy=0.;volumes=np.zeros(len(cells));stress_maxima=np.zeros(len(cells))
        for degree in (1,2):
            indices=np.flatnonzero(degrees==degree);count=4 if degree==1 else 10
            for start in range(0,len(indices),batch):
                selected=indices[start:start+batch];nodes=connections[selected,:count]
                if np.any(nodes<0) or np.any(nodes>=len(positions)):raise ValueError('Invalid portable element connectivity.')
                force,stress,energy,volume=element_action(positions[cells[selected]],u[nodes],young[selected],poisson[selected],degree)
                np.add.at(internal,nodes.ravel(),force.reshape(-1,3))
                difference=stress-stored_stress[selected]
                stress_error_squared+=float(np.sum(difference**2));max_stress_difference=max(max_stress_difference,float(np.abs(difference).max()))
                elastic_energy+=float(energy.sum());volumes[selected]=volume;stress_maxima[selected]=stress.max(axis=1)
        exact=metadata.get('attachment_formulation')=='exact'
        if exact:
            attachment,attachment_info=exact_attachment_action(internal-loads,positions,u,data['bond_slave_nodes'],data['bond_master_nodes'],data['bond_barycentric_weights'])
        else:
            attachment,attachment_info=attachment_action(positions,u,data['bond_slave_nodes'],data['bond_master_nodes'],
                data['bond_barycentric_weights'],data['bond_stiffness_n_per_mm'])
        internal+=attachment
    residual=internal-loads;applied_force=loads.sum(axis=0);reaction=residual[fixed].sum(axis=0)
    applied_moment=np.cross(positions,loads).sum(axis=0);reaction_moment=np.cross(positions[fixed],residual[fixed]).sum(axis=0)
    work=float(np.sum(loads*u));energy=elastic_energy+attachment_info['energy_n_mm']
    metrics={'free_force_relative_residual':float(np.linalg.norm(residual[~fixed])/max(np.linalg.norm(loads[~fixed]),1e-30)),
        'force_balance_error':float(np.linalg.norm(reaction+applied_force)/max(np.linalg.norm(applied_force),1e-30)),
        'moment_balance_error':float(np.linalg.norm(reaction_moment+applied_moment)/max(np.linalg.norm(applied_moment),1e-30)),
        'energy_work_relative_error':float(abs(2*energy-work)/max(abs(work),1e-30)),
        'stress_relative_difference':float(np.sqrt(stress_error_squared)/max(np.linalg.norm(stored_stress),1e-30)),
        'attachment_partition_error':attachment_info['partition_error'],
        'attachment_position_error_mm':attachment_info['position_error_mm']}
    thresholds={**THRESHOLDS}
    if exact:
        metrics['exact_attachment_slip_mm']=attachment_info['max_slip_mm'];thresholds['exact_attachment_slip_mm']=1e-9
    if metadata.get('regions') and metadata.get('params'):
        params=metadata['params'];active=[r for r in metadata['regions'] if r['kind']=='load' and (params['load_case']=='bilateral' or params['load_case'] in r['id'])]
        expected=np.zeros(3)
        for region in active:
            vector=np.array(region.get('vector') or [0,-1,0],dtype=float)
            expected+=vector/np.linalg.norm(vector)*params['load']/len(active)
        metrics['load_normalization_error']=float(np.linalg.norm(applied_force-expected)/params['load']);thresholds['load_normalization_error']=1e-10
    checks={name:bool(metrics[name]<=limit) for name,limit in thresholds.items()}
    return {'schema':'trab-independent-jaw-audit-v1','model':metadata['model'],'geometry_hash':metadata['geometry_hash'],
        'field_sha256':digest,'verifier_source_sha256':VERIFIER_SOURCE_SHA256,'nodes':len(positions),'tetrahedra':len(cells),
        'method':'Independent NumPy engineering-strain B/D matrix action, four-point integration, '+('exact constraint reactions' if exact else 'explicit penalty forces'),
        'thresholds':thresholds,'metrics':metrics,'checks':checks,'passed':all(checks.values()),'attachment_formulation':'exact' if exact else 'penalty',
        'elastic_energy_n_mm':elastic_energy,'attachment_energy_n_mm':attachment_info['energy_n_mm'],'external_work_n_mm':work,
        'compliance_n_mm':work,'load_weighted_displacement_mm':work/max(np.linalg.norm(applied_force),1e-30),
        'peak_titanium_stress_mpa':float(stress_maxima[materials==3].max()),'max_stress_difference_mpa':max_stress_difference,
        'minimum_volume_mm3':float(volumes.min()),'applied_force_n':applied_force.tolist(),'reaction_force_n':reaction.tolist(),
        'elapsed_seconds':time.perf_counter()-started,
        'scope':'Verifies algebra and exported fields for this discrete model. Does not establish mesh convergence, attachment insensitivity, anatomical validity or physical accuracy.'}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('fields',type=Path);parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();report=audit(args.fields)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2));raise SystemExit(0 if report['passed'] else 1)
