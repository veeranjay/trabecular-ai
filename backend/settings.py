"""Explicit service configuration. Values and secret contents are never logged."""
import os
from pathlib import Path
from dotenv import load_dotenv
ROOT=Path(__file__).resolve().parent
load_dotenv(ROOT/'.env')
load_dotenv(ROOT.parent/'.env')

def modal_configured():
    if os.getenv('MODAL_TOKEN_ID') and os.getenv('MODAL_TOKEN_SECRET'): return True
    try:
        from modal.config import config
        return bool(config.get('token_id') and config.get('token_secret'))
    except Exception: return False

def require_cloud_execution():
    config = configuration()
    if not config['cloud_enabled']:
        raise ValueError('Cloud execution is disabled. Use local compute; credentials alone do not enable Modal.')
    if not config['modal']:
        raise ValueError('Configure Modal before cloud computation.')
    if not 0 < config['cloud_budget_usd'] <= 30:
        raise ValueError('Cloud execution requires a positive monthly ceiling no greater than $30.')
    return config

def configuration():
    return {'deepgram':bool(os.getenv('DEEPGRAM_API_KEY')),
            'modal':modal_configured(),
            'supabase':bool(os.getenv('SUPABASE_URL') and (os.getenv('SUPABASE_SECRET_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY'))),
            'cloud_budget_usd':float(os.getenv('TRAB_CLOUD_BUDGET_USD','0')),
            'cloud_enabled':os.getenv('TRAB_CLOUD_ENABLED','false').lower()=='true',
            'compute_device':os.getenv('TRAB_COMPUTE_DEVICE','cuda:0'),
            'storage_mode':os.getenv('TRAB_STORAGE_MODE','local'),
            'auth_mode':os.getenv('TRAB_AUTH_MODE','local')}

