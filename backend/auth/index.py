"""Авторизация: регистрация, вход, получение профиля"""

import json
import os
import hashlib
import psycopg2


CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}


def hash_password(password: str) -> str:
    salt = "scriptoriy_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def make_token(user_id: int, email: str) -> str:
    secret = os.environ.get('SESSION_SECRET', 'scriptorium_secret_42')
    raw = f"{user_id}:{email}:{secret}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32] + str(user_id)


def parse_token(token: str):
    try:
        return int(token[32:])
    except Exception:
        return None


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    raw_body = event.get('body') or '{}'
    body = raw_body if isinstance(raw_body, dict) else json.loads(raw_body)
    action = body.get('action', '')

    headers = event.get('headers') or {}
    token = headers.get('X-Session-Token') or headers.get('x-session-token', '')

    # ── register ──
    if action == 'register':
        email = (body.get('email') or '').strip().lower()
        name = (body.get('name') or '').strip()
        password = body.get('password') or ''

        if not email or not name or not password:
            return _err(400, 'Заполните все поля')
        if len(password) < 6:
            return _err(400, 'Пароль должен быть не менее 6 символов')
        if '@' not in email:
            return _err(400, 'Некорректный email')

        pw_hash = hash_password(password)
        conn = get_db()
        cur = conn.cursor()
        try:
            cur.execute(
                "INSERT INTO users (email, name, password_hash) VALUES (%s, %s, %s) RETURNING id",
                (email, name, pw_hash)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return _err(409, 'Пользователь с таким email уже существует')
        finally:
            conn.close()

        session_token = make_token(user_id, email)
        return _ok({'token': session_token, 'user': {'id': user_id, 'email': email, 'name': name}})

    # ── login ──
    if action == 'login':
        email = (body.get('email') or '').strip().lower()
        password = body.get('password') or ''

        if not email or not password:
            return _err(400, 'Введите email и пароль')

        pw_hash = hash_password(password)
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, email, name FROM users WHERE email=%s AND password_hash=%s",
            (email, pw_hash)
        )
        row = cur.fetchone()
        conn.close()

        if not row:
            return _err(401, 'Неверный email или пароль')

        user_id, user_email, user_name = row
        session_token = make_token(user_id, user_email)
        return _ok({'token': session_token, 'user': {'id': user_id, 'email': user_email, 'name': user_name}})

    # ── me ──
    if action == 'me':
        if not token:
            return _err(401, 'Не авторизован')

        user_id = parse_token(token)
        if not user_id:
            return _err(401, 'Невалидный токен')

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, email, name FROM users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        conn.close()

        if not row:
            return _err(401, 'Пользователь не найден')

        uid, email, name = row
        return _ok({'user': {'id': uid, 'email': email, 'name': name}})

    return _err(400, 'Неизвестное действие')


def _ok(data: dict) -> dict:
    return {'statusCode': 200, 'headers': CORS, 'body': data}


def _err(code: int, message: str) -> dict:
    return {'statusCode': code, 'headers': CORS, 'body': {'error': message}}