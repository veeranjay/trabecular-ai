"""Experimental conforming 3D jaw elasticity, assembled and solved with Warp.

Disjoint bone segments have no contact. Locking plate/screw heads form joined
titanium domains; embedded screw surface nodes are bonded to containing bone
tetrahedra with a measured penalty constraint. No stiffness fills empty space.
Qualification is deliberately false until anatomy, thickness and bond-penalty
refinement gates have passed for this model.
"""
from __future__ import annotations
import time
import numpy as np
from scipy.spatial import cKDTree
import warp as wp
import warp.fem as fem
from warp.sparse import bsr_from_triplets, bsr_axpy
from geometry import Assembly
from volume_mesh import prepare
from fem_solver import solve_displacements
from mixed_fem import assemble,recover,EDGES

def quadratic_weights(bary):
    """Tet10 shape weights in the portable vertex/edge ordering."""
    return np.column_stack((bary*(2*bary-1),*[4*bary[:,i]*bary[:,j] for i,j in EDGES]))


@fem.integrand
def heterogeneous_elasticity(s:fem.Sample,u:fem.Field,v:fem.Field,
                            young:wp.array(dtype=wp.float64),poisson:wp.array(dtype=wp.float64)):
    e=young[s.element_index];p=poisson[s.element_index]
    mu=e/(wp.float64(2.0)*(wp.float64(1.0)+p))
    lam=e*p/((wp.float64(1.0)+p)*(wp.float64(1.0)-wp.float64(2.0)*p))
    return wp.float64(2.0)*mu*wp.ddot(fem.D(u,s),fem.D(v,s))+lam*fem.div(u,s)*fem.div(v,s)


class Locator:
    def __init__(self,points,tets):
        self.points=points;self.tets=tets
        self.origins=points[tets[:,0]]
        self.inverse=np.linalg.inv(np.transpose(points[tets[:,1:]]-self.origins[:,None],(0,2,1)))
        self.tree=cKDTree(points[tets].mean(axis=1))
    def locate(self,queries,k=96):
        cells=np.full(len(queries),-1,dtype=np.int32);weights=np.zeros((len(queries),4))
        for start in range(0,len(queries),256):
            batch=queries[start:start+256]
            _,near=self.tree.query(batch,k=min(k,len(self.tets)))
            near=np.atleast_2d(near)
            bary=np.einsum('nkij,nkj->nki',self.inverse[near],batch[:,None,:]-self.origins[near])
            bary=np.concatenate((1-bary.sum(axis=2,keepdims=True),bary),axis=2)
            valid=(bary.min(axis=2)>=-1e-7)&(bary.max(axis=2)<=1+1e-7)
            hit=valid.any(axis=1);chosen=valid.argmax(axis=1);rows=np.arange(len(batch))
            cells[start:start+len(batch)][hit]=near[rows,chosen][hit]
            weights[start:start+len(batch)][hit]=bary[rows,chosen][hit]
        return cells,weights


def solve(assembly:Assembly,quality='preview',device='cuda:0',progress=None,cancelled=None,bond_scale=100.,include_surface_fields=True,field_destination=None,attachment='penalty'):
    if attachment not in ('penalty','exact'):raise ValueError('Unknown attachment formulation.')
    started=time.perf_counter()
    def stage(message,value):
        if cancelled and cancelled():raise InterruptedError('Analysis cancelled.')
        if progress:progress(message,value)
    arrays,mesh_info=prepare(assembly,quality,progress,cancelled)
    wp.init()
    if device.startswith('cuda') and not wp.is_cuda_available():raise RuntimeError('CUDA unavailable; select CPU explicitly.')
    mixed=assemble(assembly,arrays,mesh_info,device,heterogeneous_elasticity,stage)
    points=mixed['points'];positions=mixed['positions'];tetrahedra=mixed['cells'];matrix=mixed.pop('matrix')
    node_offsets=mixed['node_offsets'];cell_offsets=mixed['cell_offsets']
    moduli=mixed['young'];nu=mixed['poisson'];material_ids=mixed['material']
    bone_locators=[Locator(arrays[f'p{i}'],arrays[f't{i}']) for i in range(3)]
    stage('Locating embedded screw bonds',.67)
    bond_nodes=[];bond_vertices=[];bond_weights=[];bond_stiffness=[];bond_counts={}
    component_index={item['id']:i for i,item in enumerate(mesh_info['components'])}
    for screw_index,screw in enumerate(assembly.screws):
        side='left' if '_left_' in screw['id'] else 'right'
        hardware_index=component_index[screw['id']] if assembly.cad_version==5 else (3 if side=='left' else 4)
        bone_index=(0 if side=='left' else 1) if screw_index%4<2 else 2
        p=points[hardware_index];a=np.asarray(screw['start']);b=np.asarray(screw['end']);d=b-a
        fraction=(p-a)@d/np.dot(d,d)
        radial=np.linalg.norm(p-a-fraction[:,None]*d,axis=1)
        candidates=np.flatnonzero((fraction>.3)&(fraction<1.01)&(radial<1.3))
        containing,bary=bone_locators[bone_index].locate(p[candidates])
        hit=containing>=0;candidates=candidates[hit];containing=containing[hit];bary=bary[hit]
        bond_counts[screw['id']]=len(candidates)
        if len(candidates)<3:raise ValueError(f"{screw['id']}: fewer than three embedded bond nodes; revise placement before analysis.")
        stiffness=bond_scale*assembly.params['modulus']*np.pi*1.1**2/assembly.params['screw_length']/len(candidates)
        for node,tet,weights in zip(candidates,containing,bary):
            bond_nodes.append(node+node_offsets[hardware_index])
            master=tetrahedra[cell_offsets[bone_index]+tet]
            bond_vertices.append(np.pad(master,(0,6)) if assembly.cad_version==5 else master)
            bond_weights.append(np.pad(weights,(0,6)) if assembly.cad_version==5 else weights);bond_stiffness.append(stiffness)
    bone_bond_count=len(bond_nodes);locking_counts={}
    if assembly.cad_version==5:
        stage('Locating explicit locking head attachments',.7)
        for screw in assembly.screws:
            side='left' if '_left_' in screw['id'] else 'right'
            plate_index=component_index[f'plate_{side}'];screw_index=component_index[screw['id']]
            locator=Locator(arrays[f'p{plate_index}'],arrays[f't{plate_index}'])
            p=points[screw_index];a=np.asarray(screw['start']);d=np.asarray(screw['end'])-a
            fraction=(p-a)@d/np.dot(d,d);radial=np.linalg.norm(p-a-fraction[:,None]*d,axis=1)
            candidates=np.flatnonzero((fraction>-.1)&(fraction<.2)&(radial>1.18))
            containing,bary=locator.locate(p[candidates],k=128)
            hit=containing>=0;candidates=candidates[hit];containing=containing[hit];bary=bary[hit]
            locking_counts[screw['id']]=len(candidates)
            if len(candidates)<3:raise ValueError(f"{screw['id']}: insufficient locking head overlap with the plate.")
            stiffness=bond_scale*110000.*np.pi*1.65**2/assembly.params['thickness']/len(candidates)
            for node,tet,weights in zip(candidates,containing,quadratic_weights(bary)):
                bond_nodes.append(node+node_offsets[screw_index])
                bond_vertices.append(mixed['connectivity'][cell_offsets[plate_index]+tet])
                bond_weights.append(weights);bond_stiffness.append(stiffness)
    bond_nodes=np.asarray(bond_nodes,dtype=np.int32)
    bond_vertices=np.asarray(bond_vertices,dtype=np.int32);bond_weights=np.asarray(bond_weights)
    loads=np.zeros_like(positions);pinned=np.zeros(len(positions),dtype=bool);region_counts={}
    for region in assembly.regions:
        center=np.asarray(region['center']);radius=region['radius']
        if region['kind']=='support':
            selected=(np.linalg.norm(positions-center,axis=1)<=radius)&(np.arange(len(positions))<node_offsets[3])
            region_counts[region['id']]=int(selected.sum());pinned|=selected
            if selected.sum()<3:raise ValueError(f"Support {region['id']} contains fewer than three bone nodes.")
    if pinned.sum()<6:raise ValueError('At least two bounded support regions must be registered.')
    active_loads=[r for r in assembly.regions if r['kind']=='load' and
        (assembly.params['load_case']=='bilateral' or assembly.params['load_case'] in r['id'])]
    if not active_loads:raise ValueError('No registered region matches the selected load case.')
    for region in active_loads:
        center=np.asarray(region['center']);selected=np.flatnonzero((np.linalg.norm(points[2]-center,axis=1)<=region['radius']))+node_offsets[2]
        if len(selected)==0:raise ValueError(f"Load {region['id']} contains no distal bone nodes; edit its registration.")
        vector=np.asarray(region.get('vector') or [0,-1,0],dtype=float)
        if np.linalg.norm(vector)<1e-12:raise ValueError('A load direction cannot have zero length.')
        loads[selected]+=vector/np.linalg.norm(vector)*assembly.params['load']/len(active_loads)/len(selected)
        region_counts[region['id']]=len(selected)
    if np.any(np.linalg.norm(loads[pinned],axis=1)>0):raise ValueError('Load and fixed-support regions overlap.')
    solved_nodes=len(positions)
    with wp.ScopedDevice(device):
        if attachment=='exact':
            from exact_ties import condense,warp_to_scipy,scipy_to_warp
            stage('Eliminating exact interpolation attachments',.72)
            reduced=condense(warp_to_scipy(matrix),positions,pinned,loads,bond_nodes,bond_vertices,bond_weights)
            del matrix
            matrix=scipy_to_warp(reduced.pop('matrix'),device)
            solved_nodes=len(reduced['positions'])
            stage('Solving exactly tied 3D equilibrium on device',.75)
            solution,telemetry=solve_displacements(matrix,wp.array(reduced['loads'],dtype=wp.vec3d),reduced['pinned'],reduced['positions'],tolerance=1e-8,max_iterations=3000,amg=True)
            u=reduced['transform']@solution.numpy()
            del reduced
        else:
            constraint_nodes=np.column_stack((bond_nodes,bond_vertices))
            coefficients=np.column_stack((np.ones(len(bond_nodes)),-bond_weights))
            scalar_blocks=np.asarray(bond_stiffness)[:,None,None]*coefficients[:,:,None]*coefficients[:,None,:]
            blocks=(scalar_blocks[:,:,:,None,None]*np.eye(3)).reshape(-1,3,3)
            rows=np.broadcast_to(constraint_nodes[:,:,None],scalar_blocks.shape).ravel()
            columns=np.broadcast_to(constraint_nodes[:,None,:],scalar_blocks.shape).ravel()
            bonds=bsr_from_triplets(len(positions),len(positions),wp.array(rows,dtype=wp.int32),
                wp.array(columns,dtype=wp.int32),wp.array(blocks,dtype=wp.mat33d))
            bsr_axpy(bonds,matrix)
            del bonds,blocks,rows,columns,scalar_blocks
            stage('Solving mixed-order 3D equilibrium on device',.75)
            solution,telemetry=solve_displacements(matrix,wp.array(loads,dtype=wp.vec3d),pinned,positions,tolerance=1e-8,max_iterations=3000,amg=True)
            u=solution.numpy()
    stage('Recovering material-specific stress and strain',.88)
    stress_q,principal=recover(positions,tetrahedra,mixed['connectivity'],mixed['degree'],u,moduli,nu)
    vm=stress_q.max(axis=1)
    slip=u[bond_nodes]-(u[bond_vertices]*bond_weights[:,:,None]).sum(axis=1)
    max_slip=float(np.linalg.norm(slip[:bone_bond_count],axis=1).max())
    max_locking_slip=float(np.linalg.norm(slip[bone_bond_count:],axis=1).max()) if len(slip)>bone_bond_count else 0.
    finite=bool(np.isfinite(u).all() and np.isfinite(vm).all())
    peak_ti=float(vm[material_ids==3].max());safety=880./peak_ti
    titanium_cells=np.flatnonzero(material_ids==3);peak_cell=int(titanium_cells[np.argmax(vm[titanium_cells])])
    resolved=finite and telemetry['relative_residual']<1e-6 and telemetry['force_balance_error']<.01
    fields={}
    for entry in (assembly.meshes if include_surface_fields else []):
        if entry['material']=='bone':component=next(i for i,c in enumerate(mesh_info['components']) if c['id']==entry['id'])
        else:component=component_index[entry['id']] if assembly.cad_version==5 else (3 if 'left' in entry['id'] else 4)
        _,local=bone_locators[component].tree.query(entry['mesh'].vertices) if component<3 else cKDTree(arrays[f'p{component}'][arrays[f't{component}']].mean(axis=1)).query(entry['mesh'].vertices)
        global_cells=local+cell_offsets[component]
        # Display uses nearest-cell values within the same material component;
        # numerical extrema above use unsmoothed cell values.
        node_tree=cKDTree(points[component]);_,nearest=node_tree.query(entry['mesh'].vertices)
        fields[entry['id']]={'stress_mpa':vm[global_cells].round(5).tolist(),
            'displacement_mm':u[nearest+node_offsets[component]].round(7).ravel().tolist()}
    result={'model':'jaw-exact-tet-v4' if attachment=='exact' else 'jaw-locking-tet-v3' if assembly.cad_version==5 else 'jaw-mixed-tet-v2','method':'NVIDIA Warp 3D FEM; linear bone / quadratic titanium',
        'geometry_hash':assembly.geometry_hash,'params':assembly.params,'device':wp.get_device(device).name,
        'nodes':len(positions),'tetrahedra':len(tetrahedra),'dofs':3*solved_nodes,'independent_nodes':solved_nodes,
        'polynomial_degrees':{'bone':1,'titanium':2},'stress_recovery':'Unsmoothed four-point tetrahedral quadrature maxima',
        'peak_titanium_cell':peak_cell,'peak_titanium_position_mm':positions[tetrahedra[peak_cell]].mean(axis=0).tolist(),
        'mesh':mesh_info,'regions_node_counts':region_counts,'bond_node_counts':bond_counts,'bond_penalty_scale':None if attachment=='exact' else bond_scale,
        'max_bond_slip_mm':max_slip,'peak_titanium_stress_mpa':peak_ti,'titanium_yield_assumption_mpa':880.,
        'locking_attachment_node_counts':locking_counts,'max_locking_slip_mm':max_locking_slip,
        'hardware_attachment':'Exact interpolation constraints, condensed without penalty stiffness' if attachment=='exact' else 'Explicit quadratic locking head-to-plate penalty ties' if assembly.cad_version==5 else 'Boolean joined locking heads/plates',
        'bond_slip_check_pass':max_slip<.01,'yield_check_pass':safety>=assembly.params['min_sf'],
        'linear_strain_check_pass':float(np.abs(principal).max())<.01,
        'safety_factor':safety,'peak_bone_stress_mpa':float(vm[material_ids!=3].max()),
        'max_abs_bone_principal_strain':float(np.abs(principal[material_ids!=3]).max()),
        'max_displacement_mm':float(np.linalg.norm(u,axis=1).max()),'geometry_checks':assembly.checks,
        'numerically_resolved':bool(resolved),'qualified':False,'status':'unqualified' if resolved else 'unresolved',
        'fields':fields,**telemetry,'elapsed_seconds':time.perf_counter()-started,
        'assumptions':['Small strain, isotropic static linear elasticity; N, mm, MPa.',
            'Cortical proxy E=17000 MPa in cells within 2 mm of sampled outer-surface vertices; core modulus is an input.',
            'Titanium E=110000 MPa, nu=0.3; 880 MPa yield is an assumed engineering threshold.',
            'Perfectly bonded screw/bone and locking-head attachments through exact interpolation constraints; overlap is not subtracted.' if attachment=='exact' else 'Separate hardware solids with explicit quadratic head-to-plate penalty ties; overlap is not subtracted.' if assembly.cad_version==5 else 'Joined locking screw heads and plate; embedded screw nodes bonded to containing bone tetrahedra.',
            'Linear Tet4 displacement in bone; quadratic Tet10 displacement in titanium. Four stress recovery points per cell.',
            'Uniform nodal force distribution within registered bite balls; total force and moment are measured.',
            'Distinct bone segments without contact; overlapping screw/bone volume is not subtracted.',
            'Nearest-cell stress and nearest-node displacement are display interpolation only.'],
        'unresolved_gates':['Anatomical/registration review','Thin plate and anatomy mesh convergence',
            'Exact attachment elimination verification' if attachment=='exact' else 'Bond penalty sensitivity','Independent full-jaw/bond assembly check']}
    if field_destination:
        from pathlib import Path
        import json
        destination=Path(field_destination);destination.parent.mkdir(parents=True,exist_ok=True)
        temporary=destination.with_suffix(f'.{__import__("uuid").uuid4().hex}.tmp.npz')
        np.savez_compressed(temporary,positions_mm=positions,tetrahedra=tetrahedra,displacement_mm=u,
            element_connectivity=mixed['connectivity'],element_degree=mixed['degree'],cell_stress_mpa=vm,quadrature_stress_mpa=stress_q,
            cell_principal_strain=principal,material_id=material_ids,young_modulus_mpa=moduli,poisson_ratio=nu,
            fixed_nodes=pinned,applied_nodal_force_n=loads,bond_slave_nodes=bond_nodes,bond_master_nodes=bond_vertices,
            bond_barycentric_weights=bond_weights,bond_stiffness_n_per_mm=np.zeros(len(bond_stiffness)) if attachment=='exact' else np.asarray(bond_stiffness),
            bone_bond_count=np.asarray(bone_bond_count),
            metadata=json.dumps({'schema':'trab-volume-fields-v4' if attachment=='exact' else 'trab-volume-fields-v3' if assembly.cad_version==5 else 'trab-volume-fields-v2','model':result['model'],'qualified':False,'attachment_formulation':attachment,
                'geometry_hash':assembly.geometry_hash,'params':assembly.params,'regions':assembly.regions,
                'materials':{'1':'cortical proxy','2':'trabecular proxy','3':'titanium'},'display_interpolation':False,
                'tet10_edge_order':[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],
                'numerical_signature':__import__('engine_fingerprint').numerical_signature()}))
        temporary.replace(destination);result['field_artifact']='fields.npz'
    result['elapsed_seconds']=time.perf_counter()-started
    stage('Analysis complete; qualification outstanding',1.)
    return result


if __name__=='__main__':
    import json
    from geometry import build
    result=solve(build('male',{}),progress=lambda message,value:print(message,flush=True))
    from pathlib import Path
    target=Path(__file__).resolve().parent/'data'/'jaw_preview.json'
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(result,allow_nan=False))
    print(json.dumps({k:v for k,v in result.items() if k not in ('fields','mesh')},indent=2))
