"""CRUD книг пользователя"""
import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

# ── Демо-данные Маленького принца ────────────────────────────────────────────

DEMO_MANUSCRIPT = json.dumps([
    {
        "id": 1,
        "title": "Посвящение",
        "content": "Леону Верту\n\nПрошу детей простить меня за то, что я посвятил эту книжку взрослому. Скажу в оправдание: этот взрослый — мой самый лучший друг. И ещё: он понимает всё на свете, даже детские книжки. И, наконец, он живёт во Франции, а там сейчас голодно и холодно. И он очень нуждается в утешении. Если же всё это меня не оправдывает, я посвящу эту книжку тому мальчику, каким был когда-то мой взрослый друг. Ведь все взрослые сначала были детьми, только мало кто из них об этом помнит.\n\nЛеону Верту, когда он был маленьким"
    },
    {
        "id": 2,
        "title": "I. Детство пилота",
        "content": "Когда мне было шесть лет, в книге под названием «Правдивые истории», где рассказывалось про девственные леса, я увидел однажды удивительную картинку. На картинке огромная змея — удав — глотала хищного зверя.\n\nВ книге говорилось: «Удав заглатывает свою жертву целиком, не жуя. После этого он уже не может шевельнуться и спит полгода подряд, пока не переварит пищу».\n\nЯ много раздумывал о полной приключений жизни джунглей и тоже нарисовал цветным карандашом свою первую картинку. Взрослые посоветовали мне не рисовать змей ни снаружи, ни изнутри, а побольше интересоваться географией, историей, арифметикой и правописанием.\n\nВот как случилось, что шести лет я отказался от блестящей карьеры художника."
    },
    {
        "id": 3,
        "title": "II. Встреча в пустыне",
        "content": "Так я жил в одиночестве, и не с кем было мне поговорить по душам. И вот шесть лет тому назад пришлось мне сделать вынужденную посадку в Сахаре. Что-то сломалось в моторе моего самолёта. Со мной не было ни механика, ни пассажиров, и я решил, что попробую сам всё починить, хоть это и очень трудно.\n\nИтак, в первый вечер я уснул на песке в пустыне, где на тысячи миль вокруг не было никакого жилья.\n\nВообразите же моё удивление, когда на рассвете меня разбудил чей-то тоненький голосок. Он сказал:\n— Пожалуйста... нарисуй мне барашка!\n\nЯ вскочил, точно надо мною грянул гром. Протёр глаза. Стал осматриваться. И увидел забавного маленького человечка, который серьёзно меня разглядывал."
    },
    {
        "id": 4,
        "title": "III. Откуда он явился",
        "content": "Не скоро я понял, откуда он явился. Маленький принц засыпал меня вопросами, но когда я спрашивал о чём-нибудь, он словно и не слышал. Лишь понемногу, из случайных, мимоходом оброненных слов мне всё открылось.\n\nКогда он впервые увидел мой самолёт, он спросил:\n— Что это за штука?\n— Это не штука. Это самолёт. Мой самолёт. Он летает.\n— Как! Ты упал с неба?\n— Да, — скромно ответил я.\n— Вот забавно!..\n\nПотом он прибавил:\n— Значит, ты тоже явился с неба. А с какой планеты?"
    }
], ensure_ascii=False)

DEMO_SYNOPSIS = """«Маленький принц» — философская сказка Антуана де Сент-Экзюпери о дружбе, любви и том, как взрослые теряют способность видеть главное.

Повествование ведётся от лица пилота, потерпевшего крушение в пустыне. Там он встречает загадочного мальчика — Маленького принца, прилетевшего с крошечной планеты. Принц рассказывает о своём доме, о капризной Розе, которую он любил, и о путешествии по разным планетам, где он встречал странных взрослых — короля, честолюбца, пьяницу, делового человека. Эти встречи раскрывают абсурдность и пустоту многих «взрослых» ценностей.

На Земле Принц знакомится с Лисом, который учит его важному: «самого главного глазами не увидишь» — ценность вещей определяется привязанностью и заботой.

В финале Маленький принц принимает решение вернуться к своей Розе, даже ценой собственной жизни, а пилот остаётся с памятью о встрече и новым пониманием мира: видеть сердцем важнее, чем глазами."""

DEMO_CHARACTERS = json.dumps([
    {
        "id": 1,
        "name": "Маленький принц",
        "role": "Главный герой",
        "photo": None,
        "freeText": "Загадочный мальчик с крошечной планеты (астероид B-612). Наивен, искренен, задаёт простые, но глубокие вопросы, которые заставляют задуматься о смысле жизни. Его путешествие по планетам — способ понять людей и самого себя.",
        "questionnaire": {
            "motivation": "Понять людей и найти настоящую дружбу",
            "arc": "От наивного одиночества — к осознанию ценности привязанности и ответственности",
            "fear": "Потерять Розу и так и не помириться с ней",
            "secret": "Сбежал с планеты из-за обиды на Розу, но любит её больше всего на свете"
        }
    },
    {
        "id": 2,
        "name": "Пилот",
        "role": "Герой-помощник",
        "photo": None,
        "freeText": "Взрослый, который не забыл, как быть ребёнком. Рассказчик истории. Встреча с Маленьким принцем меняет его взгляд на мир и возвращает способность видеть «глазами сердца».",
        "questionnaire": {
            "motivation": "Починить самолёт и выжить в пустыне; духовно — вернуть утраченное детское восприятие мира",
            "arc": "От циничного взрослого — к человеку, вновь умеющему удивляться и верить"
        }
    },
    {
        "id": 3,
        "name": "Лис",
        "role": "Второстепенный",
        "photo": None,
        "freeText": "Один из самых важных персонажей с точки зрения смысла истории. Лис учит Маленького принца «приручению» — созданию настоящей связи между существами. Именно он формулирует ключевую мысль книги: «Мы в ответе за тех, кого приручили».",
        "questionnaire": {
            "motivation": "Быть приручённым — обрести смысл в жизни через связь с другим существом",
            "arc": "Показывает Принцу, что дружба требует времени и делает уникальным"
        }
    }
], ensure_ascii=False)

DEMO_PLAN = json.dumps([
    {
        "id": "beginning",
        "label": "Начало",
        "subtitle": "Завязка, мир, герой, конфликт",
        "color": "hsl(210 55% 44%)",
        "episodes": [
            {"id": 1, "title": "Детство пилота", "description": "Пилот вспоминает детство и непонимание со стороны взрослых.", "done": True},
            {"id": 2, "title": "Крушение в пустыне", "description": "Он терпит крушение в пустыне и встречает Маленького принца.", "done": True},
            {"id": 3, "title": "Барашек в ящике", "description": "Принц просит нарисовать барашка, и между ними завязывается дружба.", "done": True}
        ]
    },
    {
        "id": "development",
        "label": "Развитие",
        "subtitle": "Осложнения, напряжение, новые цели",
        "color": "hsl(267 45% 42%)",
        "episodes": [
            {"id": 4, "title": "Планета и Роза", "description": "Принц рассказывает о своей планете и заботе о Розе.", "done": True},
            {"id": 5, "title": "Обида на Розу", "description": "Принц делится сомнениями и обидой на Розу, из-за чего решил отправиться в путешествие.", "done": True},
            {"id": 6, "title": "Планеты взрослых", "description": "Принц посещает шесть планет: король, честолюбец, пьяница, деловой человек, фонарщик, географ.", "done": True},
            {"id": 7, "title": "Одиночество на Земле", "description": "Принц прибывает на Землю и чувствует себя одиноким.", "done": True}
        ]
    },
    {
        "id": "turning",
        "label": "Поворот",
        "subtitle": "Точка невозврата",
        "color": "hsl(30 60% 44%)",
        "episodes": [
            {"id": 8, "title": "Сад роз", "description": "Принц встречает множество роз и понимает, что его Роза не уникальна внешне.", "done": True},
            {"id": 9, "title": "Урок Лиса", "description": "Лис учит его дружбе и ответственности за тех, кого приручили.", "done": True},
            {"id": 10, "title": "Осознание", "description": "Принц осознаёт истинную ценность своей Розы — не во внешности, а в привязанности.", "done": True}
        ]
    },
    {
        "id": "climax",
        "label": "Кульминация",
        "subtitle": "Главный выбор, финальное сражение, пик",
        "color": "hsl(0 50% 46%)",
        "episodes": [
            {"id": 11, "title": "Поиск воды", "description": "Пилот и Принц вместе ищут воду в пустыне и сближаются.", "done": True},
            {"id": 12, "title": "Решение вернуться", "description": "Принц решает вернуться к своей планете и Розе.", "done": True},
            {"id": 13, "title": "Укус змеи", "description": "Он позволяет змее укусить себя, чтобы покинуть Землю.", "done": True}
        ]
    },
    {
        "id": "resolution",
        "label": "Развязка",
        "subtitle": "Последствия, финальная сцена",
        "color": "hsl(150 40% 38%)",
        "episodes": [
            {"id": 14, "title": "Возвращение пилота", "description": "Пилот чинит самолёт и возвращается домой с памятью о Принце.", "done": True},
            {"id": 15, "title": "Обращение к читателю", "description": "Пилот просит читателя помнить о Маленьком принце, глядя на звёзды.", "done": True}
        ]
    }
], ensure_ascii=False)

DEMO_LORE_TAGS = json.dumps([
    {"id": 1, "label": "Мироустройство", "color": "hsl(210 55% 42%)"},
    {"id": 2, "label": "Символизм",      "color": "hsl(267 45% 42%)"}
], ensure_ascii=False)

DEMO_LORE_NOTES = json.dumps([
    {
        "id": 1,
        "title": "Астероид B-612",
        "tagIds": [1],
        "text": "Маленький принц живёт на крошечном астероиде, где есть три вулкана (два активных и один потухший) и растёт его Роза. Он ежедневно ухаживает за планетой: прочищает вулканы и вырывает ростки баобабов, чтобы те не разрушили астероид.\n\nЭто символ ответственности за свой мир и порядок в душе."
    },
    {
        "id": 2,
        "title": "Баобабы как угроза",
        "tagIds": [2],
        "text": "Баобабы — опасные растения, которые сначала выглядят безобидно, но со временем могут уничтожить целую планету. Принц предупреждает, что их нужно искоренять сразу.\n\nЭто метафора плохих привычек и разрушительных мыслей, которые важно замечать на ранней стадии."
    },
    {
        "id": 3,
        "title": "Путешествие по планетам",
        "tagIds": [1, 2],
        "text": "Каждая планета, которую посещает принц, населена одним взрослым персонажем, воплощающим человеческие пороки: власть, тщеславие, зависимость, жадность, слепое следование правилам.\n\nЭти эпизоды формируют сатирическую картину «взрослого мира» и подчёркивают одиночество людей."
    }
], ensure_ascii=False)

# ─────────────────────────────────────────────────────────────────────────────


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
            if not rows:
                # Создаём демо-книгу с полными данными
                cur.execute(
                    """INSERT INTO books (user_id, title, genre, words, manuscript, synopsis, characters, plan, lore_tags, lore_notes)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       RETURNING id, title, genre, words, created_at, updated_at""",
                    (user_id, 'Маленький принц', 'Аллегорическая повесть', 1240,
                     DEMO_MANUSCRIPT, DEMO_SYNOPSIS,
                     DEMO_CHARACTERS, DEMO_PLAN,
                     DEMO_LORE_TAGS, DEMO_LORE_NOTES)
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
                """SELECT id, title, genre, words, manuscript, synopsis,
                          characters, plan, lore_tags, lore_notes,
                          created_at, updated_at
                   FROM books WHERE id=%s AND user_id=%s""",
                (book_id, user_id)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': CORS, 'body': {'error': 'Книга не найдена'}}
            book = {
                'id': row[0], 'title': row[1], 'genre': row[2], 'words': row[3],
                'manuscript': row[4], 'synopsis': row[5],
                'characters': row[6], 'plan': row[7],
                'lore_tags': row[8], 'lore_notes': row[9],
                'created_at': str(row[10]), 'updated_at': str(row[11])
            }
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
            if 'characters' in body:
                fields.append("characters=%s"); values.append(body['characters'])
            if 'plan' in body:
                fields.append("plan=%s"); values.append(body['plan'])
            if 'lore_tags' in body:
                fields.append("lore_tags=%s"); values.append(body['lore_tags'])
            if 'lore_notes' in body:
                fields.append("lore_notes=%s"); values.append(body['lore_notes'])
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
            cur.execute("UPDATE books SET title='[удалено]' WHERE id=%s AND user_id=%s", (book_id, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': {'ok': True}}

        return {'statusCode': 400, 'headers': CORS, 'body': {'error': 'Неизвестный action'}}

    finally:
        conn.close()
