"""Transactional conservative reservations, not an estimate of actual invoices."""
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

PATH = Path(__file__).resolve().parent / 'data' / 'cloud' / 'budget.sqlite3'
RESERVATION_USD = .50


def reserve(identifier, ceiling=30., path=PATH):
    if not 0 < ceiling <= 30: raise ValueError('Cloud ceiling must be positive and no more than $30.')
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    period = datetime.now(timezone.utc).strftime('%Y-%m')
    with sqlite3.connect(path, timeout=15) as db:
        db.execute('CREATE TABLE IF NOT EXISTS reservations (id TEXT PRIMARY KEY, period TEXT, usd REAL, state TEXT, details TEXT)')
        db.execute('BEGIN IMMEDIATE')
        if db.execute('SELECT id FROM reservations WHERE id=?', (identifier,)).fetchone():
            raise ValueError('A cloud request identity cannot execute twice.')
        total = db.execute('SELECT COALESCE(SUM(usd),0) FROM reservations WHERE period=?', (period,)).fetchone()[0]
        if total + RESERVATION_USD > ceiling + 1e-9:
            raise ValueError('Monthly cloud reservations exhausted. Review billing before more work.')
        db.execute('INSERT INTO reservations VALUES(?,?,?,?,?)', (identifier, period, RESERVATION_USD, 'reserved', '{}'))
    return {'reservation_usd': RESERVATION_USD, 'monthly_reserved_usd': round(total + RESERVATION_USD, 2), 'ceiling_usd': ceiling, 'period': period}


def record(identifier, state, details, path=PATH):
    with sqlite3.connect(path, timeout=15) as db:
        db.execute('UPDATE reservations SET state=?,details=? WHERE id=?', (state, json.dumps(details, allow_nan=False), identifier))


def summary(path=PATH):
    if not Path(path).exists(): return {'reserved_usd': 0., 'reservations': [], 'ceiling_usd': 30.}
    period = datetime.now(timezone.utc).strftime('%Y-%m')
    with sqlite3.connect(path) as db:
        rows = db.execute('SELECT id,usd,state,details FROM reservations WHERE period=? ORDER BY rowid DESC', (period,)).fetchall()
    return {'reserved_usd': round(sum(row[1] for row in rows), 2), 'ceiling_usd': 30., 'period': period,
            'reservations': [{'id': row[0], 'reserved_usd': row[1], 'state': row[2], **json.loads(row[3])} for row in rows],
            'note': 'Conservative reservations retained after failures; check provider billing for actual charges.'}
