"""Typed case, revision and job contracts shared by every UI/voice action."""
from __future__ import annotations
from typing import Literal, Annotated
from pydantic import BaseModel, ConfigDict, Field,field_validator,model_validator

Vec3=tuple[float,float,float]
class PlateParameters(BaseModel):
    model_config=ConfigDict(extra='forbid',allow_inf_nan=False)
    thickness:float=Field(1.5,ge=1,le=3.5)
    width:float=Field(3.,ge=2,le=6)
    offset:float=Field(0.,ge=0,le=10)
    load:float=Field(520.,ge=100,le=1000)
    modulus:float=Field(1200.,ge=450,le=1900)
    min_clearance:float=Field(4.,ge=2,le=8)
    min_sf:float=Field(1.8,ge=1.5,le=4)
    advancement:float=Field(6.,ge=2,le=8)
    screw_length:float=Field(8.,ge=4,le=16)
    screw_angle:float=Field(0.,ge=-20,le=20)
    plate_shift:float=Field(0.,ge=-4,le=4)
    load_case:Literal['bilateral','left','right']='bilateral'
    @field_validator('thickness','width','offset','load','modulus','min_clearance','min_sf','advancement','screw_length','screw_angle','plate_shift',mode='before')
    @classmethod
    def real_number(cls,value):
        if isinstance(value,bool):raise ValueError('Use a numeric value, not a boolean.')
        return value

class Region(BaseModel):
    model_config=ConfigDict(extra='forbid',allow_inf_nan=False)
    id:str=Field(min_length=1,max_length=80)
    kind:Literal['support','load','keep_out']
    center:Vec3
    radius:float=Field(ge=.5,le=25)
    vector:Vec3|None=None
    points:list[Vec3]|None=Field(default=None,min_length=1,max_length=20)
    source:Literal['developer_reference','manual','imported']='developer_reference'
    @model_validator(mode='after')
    def path_only_for_keep_out(self):
        if self.points and self.kind!='keep_out':raise ValueError('Polyline points are supported only for keep-out regions.')
        return self

class CaseCreate(BaseModel):
    name:str=Field(min_length=1,max_length=120)
    anatomy_id:str

class RevisionCreate(BaseModel):
    params:PlateParameters
    parent_id:str|None=None
    preparation_from_parent:bool=False
    cad_version:Literal[3,4,5]|None=None
    label:str=Field(default='Design revision',max_length=120)

class PreparationUpdate(BaseModel):
    regions:list[Region]=Field(max_length=30)
    units:Literal['mm']='mm'
    reviewed:bool=False
    import_orientation:Vec3|None=None
    @field_validator('import_orientation')
    @classmethod
    def bounded_orientation(cls,value):
        if value and any(abs(v)>180 for v in value):raise ValueError('Orientation angles must be between -180 and 180 degrees.')
        return value

class GeometryPreview(BaseModel):
    params:PlateParameters
    cad_version:Literal[3,4,5]=3
    regions:list[Region]=Field(max_length=30)
    import_orientation:Vec3|None=None

class JobCreate(BaseModel):
    action:Literal['solve','optimize','study','benchmark3d','benchmark_beam']
    case_id:str
    revision_id:str
    model:Literal['beam','gpu3d']='gpu3d'
    quality:Literal['preview','standard','refined']='preview'
    force:bool=False

class VoiceToolRequest(BaseModel):
    name:Literal['inspect_results','focus_region','propose_parameters','apply_parameters','run_analysis','optimize_plate','run_study','cancel_job']
    call_id:str=Field(min_length=1,max_length=180)
    case_id:str
    revision_id:str
    arguments:dict=Field(default_factory=dict)
