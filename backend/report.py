"""Reproducible PDF evidence from a saved assembly and its actual completed job."""
from __future__ import annotations
import hashlib
import math
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape
import numpy as np
from PIL import Image,ImageDraw
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,Image as PDFImage,PageBreak,KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from storage import DATA,timestamp

FONT='Helvetica'
font_path=Path('C:/Windows/Fonts/segoeui.ttf')
if font_path.exists():
    pdfmetrics.registerFont(TTFont('TrabSans',str(font_path)));FONT='TrabSans'

INK=colors.HexColor('#19201D');MUTED=colors.HexColor('#65716B');LINE=colors.HexColor('#DDE3DD')
STYLES={
    'title':ParagraphStyle('title',fontName=FONT,fontSize=25,leading=30,textColor=INK,spaceAfter=9),
    'heading':ParagraphStyle('heading',fontName=FONT,fontSize=14,leading=19,textColor=INK,spaceBefore=17,spaceAfter=8,keepWithNext=True),
    'body':ParagraphStyle('body',fontName=FONT,fontSize=9.5,leading=14,textColor=INK,spaceAfter=7),
    'small':ParagraphStyle('small',fontName=FONT,fontSize=8.2,leading=12,textColor=MUTED,spaceAfter=5,wordWrap='CJK'),
    'metric':ParagraphStyle('metric',fontName=FONT,fontSize=20,leading=25,textColor=INK),
    'status':ParagraphStyle('status',fontName=FONT,fontSize=10,leading=15,textColor=colors.HexColor('#73511F')),
}

def plain(value):
    return str(value).replace('—','-').replace('–','-').replace('×','x').replace('·',' / ').replace('°',' deg')

def p(value,style='body'):return Paragraph(escape(plain(value)),STYLES[style])

def fmt(value,unit='',digits=3):
    if value is None:return 'Not computed'
    if isinstance(value,(int,float)) and math.isfinite(value):return f'{value:,.{digits}g}'+(f' {unit}' if unit else '')
    return plain(value)

def geometry_image(assembly):
    folder=DATA/'reports';folder.mkdir(parents=True,exist_ok=True)
    path=folder/f'{assembly.geometry_hash}.png'
    if path.exists():return path
    width,height=1200,600
    image=Image.new('RGB',(width,height),'#F5F7F3');draw=ImageDraw.Draw(image)
    direction=np.array([1.,.3,1.4]);direction/=np.linalg.norm(direction)
    right=np.cross([0,1,0],direction);right/=np.linalg.norm(right);up=np.cross(direction,right)
    all_vertices=np.vstack([entry['mesh'].vertices for entry in assembly.meshes])
    projected=np.column_stack((all_vertices@right,all_vertices@up));lo=projected.min(0);hi=projected.max(0)
    scale=min((width-120)/max(hi[0]-lo[0],1),(height-60)/max(hi[1]-lo[1],1));center=(lo+hi)/2
    triangles=[];light=np.array([-.4,.8,.6]);light/=np.linalg.norm(light)
    for entry in assembly.meshes:
        mesh=entry['mesh'];vertices=np.asarray(mesh.vertices)
        screen=np.column_stack(((vertices@right-center[0])*scale+width/2,height/2-(vertices@up-center[1])*scale))
        depth=vertices@direction;base=np.array([224,220,204]) if entry['material']=='bone' else np.array([136,152,164])
        for face,normal in zip(mesh.faces,mesh.face_normals):
            if np.dot(normal,direction)<-.03:continue
            shade=.62+.38*max(0,np.dot(normal,light))
            triangles.append((depth[face].mean(),screen[face],tuple(np.clip(base*shade,0,255).astype(int))))
    for _,points,color in sorted(triangles,key=lambda item:item[0]):draw.polygon([tuple(point) for point in points],fill=color)
    temporary=path.with_suffix(f'.{__import__("uuid").uuid4().hex}.tmp.png');image.save(temporary);temporary.replace(path)
    return path

def table(rows,widths=(160,350)):
    data=[[p(a,'small'),p(b)] for a,b in rows]
    result=Table(data,colWidths=list(widths),hAlign='LEFT')
    result.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),
        ('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
        ('LINEBELOW',(0,0),(-1,-1),.4,LINE)]))
    return result

def generate(case,revision,assembly,job=None,result=None):
    result=result if result and result.get('model') in ('jaw-conforming-tet-v1','jaw-mixed-tet-v2','jaw-locking-tet-v3','jaw-exact-tet-v4') else None
    imported=bool(case.get('import_id'))
    status='INSPECTION ONLY - PREPARATION REQUIRED' if imported else 'UNQUALIFIED - ENGINEERING EXPLORATION'
    stream=BytesIO();doc=SimpleDocTemplate(stream,pagesize=A4,rightMargin=42,leftMargin=42,topMargin=64,bottomMargin=48,
        title=f"Trabecular - {plain(case['name'])}",author='Trabecular workspace',pageCompression=1)
    generated=timestamp();width=A4[0]-84
    def frame(canvas,document):
        canvas.saveState();canvas.setFillColor(INK);canvas.setFont(FONT,10);canvas.drawString(42,A4[1]-31,'Trabecular')
        canvas.setFillColor(MUTED);canvas.setFont(FONT,8);canvas.drawRightString(A4[0]-42,A4[1]-31,'Engineering evidence / saved revision')
        canvas.setStrokeColor(LINE);canvas.line(42,A4[1]-42,A4[0]-42,A4[1]-42)
        canvas.line(42,35,A4[0]-42,35);canvas.setFont(FONT,7);canvas.drawString(42,23,'Generated '+generated[:19]+' UTC')
        canvas.drawRightString(A4[0]-42,23,f'Page {document.page}');canvas.restoreState()
    story=[p(case['name'],'title'),p(revision['label']+' / '+assembly.anatomy['name'],'small'),Spacer(1,8)]
    badge=Table([[p(status,'status')]],colWidths=[width]);badge.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#F5EEDB')),
        ('BOX',(0,0),(-1,-1),.5,colors.HexColor('#DED0A9')),('LEFTPADDING',(0,0),(-1,-1),11),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]));story.extend([badge,Spacer(1,14)])
    story.extend([PDFImage(str(geometry_image(assembly)),width=width,height=width/2),Spacer(1,7),p('Saved geometry view. The surface image is not a stress or validation result.','small')])
    if result:
        metrics=[('Peak titanium stress',fmt(result['peak_titanium_stress_mpa'],'MPa',5)),('Yield margin',fmt(result['safety_factor'],'x')),('Displacement',fmt(result['max_displacement_mm'],'mm'))]
        metric_table=Table([[p(label,'small') for label,_ in metrics],[p(value,'metric') for _,value in metrics]],colWidths=[width/3]*3)
        metric_table.setStyle(TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),4)]));story.extend([Spacer(1,8),metric_table])
        story.append(p('Equilibrium '+('converged' if result['numerically_resolved'] else 'did not converge')+'. Model qualification is outstanding.'))
        if result['peak_titanium_stress_mpa']>880:story.append(p('The assumed 880 MPa titanium yield limit is exceeded. The linear calculation does not model post-yield response.'))
    else:story.append(p('No completed 3D jaw analysis is included for this revision. '+('The imported surface is not analysis-ready.' if imported else 'Geometry checks alone do not establish mechanical performance.')))
    provenance=[p('Provenance','heading'),p('Source SHA-256: '+assembly.anatomy['source_sha256'],'small'),p('Input / geometry SHA-256: '+assembly.geometry_hash,'small')]
    if revision.get('anatomy_snapshot'):provenance.append(p('Prepared asset version: '+revision['anatomy_snapshot'],'small'))
    if not imported:provenance.append(p('Fixation geometry version: '+str(revision.get('cad_version',3)),'small'))
    if job:provenance.append(p('Analysis job: '+job['id'],'small'))
    if assembly.anatomy.get('source_url'):provenance.append(p('Dataset: '+assembly.anatomy['source_url'],'small'))
    if assembly.anatomy.get('authors'):provenance.append(p('Dataset authors: '+assembly.anatomy['authors'],'small'))
    if assembly.anatomy.get('source_paper'):provenance.append(p('CT provenance: '+assembly.anatomy['source_paper'],'small'))
    story.append(KeepTogether(provenance))
    story.extend([PageBreak(),p('Inputs and numerical evidence','title'),p('Saved case and revision are the source of every value below.','small')])
    input_rows=[('Case ID',case['id']),('Revision ID',revision['id']),('Units','N / mm / MPa'),('Surface license',assembly.anatomy['license'])]
    if imported:
        input_rows.extend([('Original source units',assembly.anatomy['source_units']),('Scale to millimeters',assembly.anatomy['scale_to_mm']),
                           ('Saved orientation',str(revision.get('import_orientation') or [0,0,0])+' deg'),('Watertight surface',str(assembly.anatomy['geometry_quality']['watertight']))])
    else:
        units={'thickness':'mm','width':'mm','offset':'mm','load':'N','modulus':'MPa','min_clearance':'mm','min_sf':'x','advancement':'mm','screw_length':'mm','screw_angle':'deg','plate_shift':'mm'}
        for key,value in revision['params'].items():input_rows.append((key.replace('_',' ').capitalize(),fmt(value,units.get(key,''))))
    story.append(table(input_rows,(155,width-155)))
    if result:
        story.append(p('Numerical diagnostics','heading'))
        story.append(table([('Model',result['model']),('Device',result['device']),('Nodes / tetrahedra',f"{result['nodes']:,} / {result['tetrahedra']:,}"),
            ('True relative residual',f"{result['relative_residual']:.3e}"),('Force imbalance',fmt(result['force_balance_error']*100,'%',4)),
            ('Moment imbalance',fmt(result['moment_balance_error']*100,'%',4)),('Bone tie constraint error' if result['model']=='jaw-exact-tet-v4' else 'Maximum bond slip',fmt(result['max_bond_slip_mm'],'mm',4)),
            ('GPU solve / total',fmt(result['solve_seconds'],'s')+' / '+fmt(result['elapsed_seconds'],'s'))],(155,width-155)))
        if result.get('max_locking_slip_mm') is not None:
            story.append(table([('Head tie constraint error' if result['model']=='jaw-exact-tet-v4' else 'Maximum locking head slip',fmt(result['max_locking_slip_mm'],'mm',4)),
                ('Hardware attachment',result.get('hardware_attachment','Not recorded'))],(155,width-155)))
    if not imported:
        story.append(p('Saved geometric checks','heading'))
        story.append(table([('Screw keep-out clearance',fmt(assembly.checks['min_clearance_mm'],'mm')+' / '+('meets' if assembly.checks['clearance_pass'] else 'fails')+' threshold'),
            ('Minimum hole spacing',fmt(assembly.checks['min_hole_spacing_mm'],'mm')),('Minimum engagement proxy',fmt(assembly.checks['min_bone_engagement_proxy_mm'],'mm'))],(155,width-155)))
    story.extend([p('Model scope and open gates','heading')])
    statements=result.get('unresolved_gates',[]) if result else assembly.anatomy.get('missing_preparation',[])
    for statement in statements:story.append(p('- '+statement))
    for statement in (result.get('assumptions',[]) if result else [assembly.anatomy['osteotomy'],assembly.anatomy['registration']]):story.append(p(statement,'small'))
    story.append(p('This report records engineering calculations and their limitations. No experimental or clinical validation is established by these calculation checks.','small'))
    doc.build(story,onFirstPage=frame,onLaterPages=frame)
    return stream.getvalue()
