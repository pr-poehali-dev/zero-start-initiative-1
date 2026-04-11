"""Цели по книгам и история написания (синхронизация между устройствами)"""
import json
import os
import hashlib
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}


def parse_token(token: str):
    try:
        return int(token[32:])
    except Exception:
        return None


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def verify_user(token: str):
    if not token:
        return None
    user_id = parse_token(token)
    if not user_id:
        return None
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE id=%s", (user_id,))
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    """Управление целями книг и историей написания"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    token = event.get('headers', {}).get('X-Session-Token', '')
    user_id = verify_user(token)
    if not user_id:
        return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Не авторизован'})}

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    action = body.get('action', '')
    conn = get_db()
    cur = conn.cursor()

    try:
        # ── Цели по книгам ────────────────────────────────────────────────────

        if action == 'get_goals':
            cur.execute(
                "SELECT book_id, goal_chars FROM book_goals WHERE user_id=%s",
                (user_id,)
            )
            rows = cur.fetchall()
            goals = {str(r[0]): r[1] for r in rows}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'goals': goals})}

        if action == 'set_goal':
            book_id = body.get('book_id')
            goal_chars = body.get('goal_chars', 0)
            if not book_id:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет book_id'})}
            cur.execute(
                """INSERT INTO book_goals (user_id, book_id, goal_chars, updated_at)
                   VALUES (%s, %s, %s, NOW())
                   ON CONFLICT (user_id, book_id) DO UPDATE SET goal_chars=EXCLUDED.goal_chars, updated_at=NOW()""",
                (user_id, book_id, goal_chars)
            )
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # ── История написания ─────────────────────────────────────────────────

        if action == 'get_history':
            cur.execute(
                "SELECT day::text, chars FROM writing_history WHERE user_id=%s ORDER BY day",
                (user_id,)
            )
            rows = cur.fetchall()
            history = {r[0]: r[1] for r in rows}
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'history': history})}

        if action == 'save_history':
            # Принимаем полный словарь { "YYYY-MM-DD": chars } и делаем upsert
            history = body.get('history', {})
            for day, chars in history.items():
                cur.execute(
                    """INSERT INTO writing_history (user_id, day, chars, updated_at)
                       VALUES (%s, %s, %s, NOW())
                       ON CONFLICT (user_id, day) DO UPDATE SET chars=EXCLUDED.chars, updated_at=NOW()""",
                    (user_id, day, chars)
                )
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        if action == 'record_day':
            # Добавить/обновить запись за конкретный день
            day = body.get('day')   # "YYYY-MM-DD"
            chars = body.get('chars', 0)
            if not day:
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет day'})}
            cur.execute(
                """INSERT INTO writing_history (user_id, day, chars, updated_at)
                   VALUES (%s, %s, %s, NOW())
                   ON CONFLICT (user_id, day) DO UPDATE SET chars=EXCLUDED.chars, updated_at=NOW()""",
                (user_id, day, chars)
            )
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неизвестный action'})}

    finally:
        conn.close()
