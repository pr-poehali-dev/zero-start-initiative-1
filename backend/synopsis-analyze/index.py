"""Анализ синопсиса писателя по профессиональным правилам"""
import json
import os
import urllib.request


SYNOPSIS_RULES = """
Правила профессионального синопсиса:

1. ОБЪЁМ: 1–2 страницы (1000–2500 знаков). Не пересказ, а сжатая суть.
2. СТРУКТУРА: начало → развитие → кульминация → развязка. Должна быть внутренняя логика.
3. ГЕРОЙ: с первых строк — кто главный герой, его ключевая черта/желание/конфликт.
4. КОНФЛИКТ: должен быть чётко обозначен центральный конфликт (внешний и/или внутренний).
5. СТАВКИ: читатель должен понимать, что герой потеряет, если не достигнет цели.
6. РАЗВЯЗКА: синопсис ВСЕГДА раскрывает финал — это не спойлер, это обязательное требование.
7. ЯЗЫК: настоящее время («герой идёт», не «герой пошёл»). Без лирических отступлений.
8. ИМЕНА: только главные персонажи (2–4), остальные — «друг», «наставник».
9. ЭМОЦИОНАЛЬНЫЙ МОМЕНТ: должен быть один момент внутренней трансформации героя.
10. ЧАСТЫЕ ОШИБКИ: аннотация вместо синопсиса; нет финала; слишком много персонажей; сухой пересказ без динамики; нет внутреннего конфликта.
"""


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    synopsis_text = body.get('synopsis', '').strip()

    if not synopsis_text:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Текст синопсиса не передан'})
        }

    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'API-ключ не настроен'})
        }

    prompt = f"""Ты — опытный литературный редактор. Проанализируй синопсис автора по следующим профессиональным правилам:

{SYNOPSIS_RULES}

Синопсис автора:
\"\"\"
{synopsis_text}
\"\"\"

Дай анализ в формате JSON:
{{
  "overall": "Общая оценка одним абзацем — тепло, по-человечески, без снисхождения",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "issues": [
    {{"rule": "название правила", "problem": "что именно не так", "suggestion": "как исправить конкретно"}}
  ],
  "score": число от 1 до 10
}}

Будь конкретным. Указывай на реальные проблемы в тексте, а не абстрактные советы. Если всё хорошо по пункту — не упоминай его."""

    request_data = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [{'role': 'user', 'content': prompt}],
        'response_format': {'type': 'json_object'},
        'temperature': 0.7,
        'max_tokens': 1200,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=request_data,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST'
    )

    with urllib.request.urlopen(req, timeout=25) as resp:
        result = json.loads(resp.read().decode('utf-8'))

    content = result['choices'][0]['message']['content']
    analysis = json.loads(content)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(analysis, ensure_ascii=False)
    }
