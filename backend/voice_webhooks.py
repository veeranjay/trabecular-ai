"""FastAPI transport for the same local numerical engine used by Next.js."""
import asyncio
import os
import secrets
from pathlib import Path
from typing import Any, Literal
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
try:
    from .engine import dispatch
except ImportError:
    from engine import dispatch

app = FastAPI(title='Trabecular local analysis engine', version='0.2.0')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:3000','http://127.0.0.1:3000'], allow_methods=['GET','POST'], allow_headers=['Content-Type','Authorization'])
ASSETS = Path(__file__).resolve().parent.parent / 'frontend/public/assets'

class AnalysisRequest(BaseModel):
    action: Literal['solve','optimize','cohort','benchmark'] = 'solve'
    params: dict[str, Any] = Field(default_factory=dict)

class ToolCall(BaseModel):
    tool_name: Literal['inspect_simulation_state','run_autonomous_remediation','run_virtual_cohort_check','control_3d_camera']
    arguments: dict[str, Any] = Field(default_factory=dict)

@app.get('/health')
def health():
    return {'status':'ready','solver_backend':'CPU beam finite elements','gpu_solver_available':False,
            'voice_transport':'legacy reduced-model webhook only','deepgram_session_connected':False,
            'model':'plate-beam-v1','anatomy_available':(ASSETS/'mandible.stl').exists()}

@app.post('/api/engine')
async def analyze(request: AnalysisRequest):
    try:
        return await asyncio.to_thread(dispatch, request.model_dump())
    except (ValueError, RuntimeError) as error:
        raise HTTPException(422, str(error)) from error

@app.get('/api/assets/{filename}')
def asset(filename: str):
    if filename not in {'mandible.stl','anatomy.json'} or not (ASSETS/filename).is_file():
        raise HTTPException(404, 'Asset not found.')
    return FileResponse(ASSETS/filename)

@app.post('/api/voice/tool_call')
async def voice_tool(request: ToolCall, authorization: str | None = Header(default=None)):
    token = os.getenv('TRAB_VOICE_WEBHOOK_TOKEN')
    if not token:
        raise HTTPException(503,'Voice integration is not configured. Set TRAB_VOICE_WEBHOOK_TOKEN to enable protected tool webhooks.')
    if not secrets.compare_digest(authorization or '', f'Bearer {token}'):
        raise HTTPException(401,'Invalid webhook authorization.')
    if request.tool_name == 'control_3d_camera':
        raise HTTPException(501,'Remote camera session transport is not connected.')
    action = {'inspect_simulation_state':'solve','run_autonomous_remediation':'optimize',
              'run_virtual_cohort_check':'cohort'}[request.tool_name]
    try:
        result = await asyncio.to_thread(dispatch, {'action':action,'params':request.arguments.get('params',{})})
        return {'tool':request.tool_name,'result':result,'method':'CPU beam finite elements',
                'frontend_session_connected':False}
    except (ValueError, RuntimeError) as error:
        raise HTTPException(422,str(error)) from error

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=8000)
