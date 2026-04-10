"""CRUD книг пользователя"""
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
    """Возвращает user_id или None"""
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


def count_words(text: str) -> int:
    return len(text.strip().split()) if text.strip() else 0


def handler(event: dict, context) -> dict:
    """Управление книгами: list, get, create, update, delete"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Session-Token') or headers.get('x-session-token', '')
    user_id = verify_user(token)

    if not user_id:
        return {'statusCode': 401, 'headers': CORS, 'body': {'error': 'Не авторизован'}}

    raw_body = event.get('body') or '{}'
    body = raw_body if isinstance(raw_body, dict) else json.loads(raw_body)
    action = body.get('action', '')

    conn = get_db()
    cur = conn.cursor()

    try:
        # ── list ──
        if action == 'list':
            cur.execute(
                "SELECT id, title, genre, words, created_at, updated_at FROM books WHERE user_id=%s ORDER BY updated_at DESC",
                (user_id,)
            )
            rows = cur.fetchall()
            # Создать демо-книгу если нет ни одной
            if not rows:
                demo_manuscript = """Леону Верту

     Прошу детей простить меня за то, что я посвятил эту книжку взрослому. Скажу в оправдание: этот взрослый - мой самый лучший друг. И ещё: он понимает всё на свете, даже детские книжки. И, наконец, он живёт во Франции, а там сейчас голодно и холодно. И он очень нуждается в утешении. Если же всё это меня не оправдывает, я посвящу эту книжку тому мальчику, каким был когда-то мой взрослый друг. Ведь все взрослые сначала были детьми, только мало кто из них об этом помнит.

                                                  Леону Верту,
                                        когда он был маленьким


I

     Когда мне было шесть лет, в книге под названием "Правдивые истории", где рассказывалось про девственные леса, я увидел однажды удивительную картинку. На картинке огромная змея - удав - глотала хищного зверя.
     В книге говорилось: "Удав заглатывает свою жертву целиком, не жуя. После этого он уже не может шевельнуться и спит полгода подряд, пока не переварит пищу".
     Я много раздумывал о полной приключений жизни джунглей и тоже нарисовал цветным карандашом свою первую картинку. Это был мой рисунок N 1. Вот что я нарисовал. Я показал мое творение взрослым и спросил, не страшно ли им.
     - Разве шляпа страшная? - возразили мне.
     А это была совсем не шляпа. Это был удав, который проглотил слона. Тогда я нарисовал удава изнутри, чтобы взрослым было понятнее. Им ведь всегда нужно всё объяснять. Это мой рисунок N 2.
     Взрослые посоветовали мне не рисовать змей ни снаружи, ни изнутри, а побольше интересоваться географией, историей, арифметикой и правописанием. Вот как случилось, что шести лет я отказался от блестящей карьеры художника.

II

     Так я жил в одиночестве, и не с кем было мне поговорить по душам. И вот шесть лет тому назад пришлось мне сделать вынужденную посадку в Сахаре. Что-то сломалось в моторе моего самолёта. Со мной не было ни механика, ни пассажиров, и я решил, что попробую сам всё починить, хоть это и очень трудно.
     Итак, в первый вечер я уснул на песке в пустыне, где на тысячи миль вокруг не было никакого жилья. Вообразите же моё удивление, когда на рассвете меня разбудил чей-то тоненький голосок. Он сказал:
     - Пожалуйста... нарисуй мне барашка!
     Я вскочил, точно надо мною грянул гром. Протёр глаза. Стал осматриваться. И увидел забавного маленького человечка, который серьёзно меня разглядывал.

III

     Не скоро я понял, откуда он явился. Маленький принц засыпал меня вопросами, но когда я спрашивал о чём-нибудь, он словно и не слышал. Лишь понемногу, из случайных, мимоходом оброненных слов мне всё открылось. Когда он впервые увидел мой самолёт, он спросил:
     - Что это за штука?
     - Это не штука. Это самолёт. Мой самолёт. Он летает.
     - Как! Ты упал с неба?
     - Да, - скромно ответил я.
     - Вот забавно!..
     Потом он прибавил:
     - Значит, ты тоже явился с неба. А с какой планеты?"""

                demo_synopsis = """«Маленький принц» — философская сказка Антуана де Сент-Экзюпери о дружбе, любви и том, как взрослые теряют способность видеть главное.

Повествование ведётся от лица пилота, потерпевшего крушение в пустыне. Там он встречает загадочного мальчика — Маленького принца, прилетевшего с крошечной планеты. Принц рассказывает о своём доме, о капризной Розе, которую он любил, и о путешествии по разным планетам, где он встречал странных взрослых — короля, честолюбца, пьяницу, делового человека. Эти встречи раскрывают абсурдность и пустоту многих «взрослых» ценностей.

На Земле Принц знакомится с Лисом, который учит его важному: «самого главного глазами не увидишь» — ценность вещей определяется привязанностью и заботой.

В финале Маленький принц принимает решение вернуться к своей Розе, даже ценой собственной жизни, а пилот остаётся с памятью о встрече и новым пониманием мира: видеть сердцем важнее, чем глазами."""

                demo_words = count_words(demo_manuscript)
                cur.execute(
                    "INSERT INTO books (user_id, title, genre, words, manuscript, synopsis) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, title, genre, words, created_at, updated_at",
                    (user_id, 'Маленький принц', 'Аллегорическая повесть', demo_words, demo_manuscript, demo_synopsis)
                )
                row = cur.fetchone()
                conn.commit()
                rows = [row]
            books = [{'id': r[0], 'title': r[1], 'genre': r[2], 'words': r[3],
                      'created_at': str(r[4]), 'updated_at': str(r[5])} for r in rows]
            return {'statusCode': 200, 'headers': CORS, 'body': {'books': books}}

        # ── get ──
        if action == 'get':
            book_id = body.get('book_id')
            cur.execute(
                "SELECT id, title, genre, words, manuscript, synopsis, created_at, updated_at FROM books WHERE id=%s AND user_id=%s",
                (book_id, user_id)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': CORS, 'body': {'error': 'Книга не найдена'}}
            book = {'id': row[0], 'title': row[1], 'genre': row[2], 'words': row[3],
                    'manuscript': row[4], 'synopsis': row[5],
                    'created_at': str(row[6]), 'updated_at': str(row[7])}
            return {'statusCode': 200, 'headers': CORS, 'body': {'book': book}}

        # ── create ──
        if action == 'create':
            title = (body.get('title') or 'Без названия').strip()
            genre = (body.get('genre') or '').strip()
            cur.execute(
                "INSERT INTO books (user_id, title, genre) VALUES (%s, %s, %s) RETURNING id, title, genre, words, created_at, updated_at",
                (user_id, title, genre)
            )
            row = cur.fetchone()
            conn.commit()
            book = {'id': row[0], 'title': row[1], 'genre': row[2], 'words': row[3],
                    'created_at': str(row[4]), 'updated_at': str(row[5])}
            return {'statusCode': 200, 'headers': CORS, 'body': {'book': book}}

        # ── update ──
        if action == 'update':
            book_id = body.get('book_id')
            fields = []
            values = []
            if 'title' in body:
                fields.append("title=%s"); values.append(body['title'].strip() or 'Без названия')
            if 'genre' in body:
                fields.append("genre=%s"); values.append(body['genre'].strip())
            if 'manuscript' in body:
                fields.append("manuscript=%s"); values.append(body['manuscript'])
                fields.append("words=%s"); values.append(count_words(body['manuscript']))
            if 'synopsis' in body:
                fields.append("synopsis=%s"); values.append(body['synopsis'])
            if not fields:
                return {'statusCode': 400, 'headers': CORS, 'body': {'error': 'Нечего обновлять'}}
            fields.append("updated_at=NOW()")
            values += [book_id, user_id]
            cur.execute(
                f"UPDATE books SET {', '.join(fields)} WHERE id=%s AND user_id=%s RETURNING id, title, genre, words",
                values
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return {'statusCode': 404, 'headers': CORS, 'body': {'error': 'Книга не найдена'}}
            return {'statusCode': 200, 'headers': CORS, 'body': {'book': {'id': row[0], 'title': row[1], 'genre': row[2], 'words': row[3]}}}

        # ── delete ──
        if action == 'delete':
            book_id = body.get('book_id')
            cur.execute("UPDATE books SET title=title WHERE id=%s AND user_id=%s RETURNING id", (book_id, user_id))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': CORS, 'body': {'error': 'Книга не найдена'}}
            # Soft: просто помечаем заголовком (реального удаления нет из-за ограничений)
            cur.execute("UPDATE books SET title='[удалено]', updated_at=NOW() WHERE id=%s AND user_id=%s", (book_id, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': {'ok': True}}

    finally:
        conn.close()

    return {'statusCode': 400, 'headers': CORS, 'body': {'error': 'Неизвестное действие'}}