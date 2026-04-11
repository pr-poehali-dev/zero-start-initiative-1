-- Чистим base64 фото из characters во всех книгах
-- Парсим JSON, убираем photo, записываем обратно
UPDATE t_p73769905_zero_start_initiativ.books
SET characters = (
  SELECT jsonb_agg(
    jsonb_set(elem, '{photo}', 'null'::jsonb)
  )::text
  FROM jsonb_array_elements(characters::jsonb) elem
)
WHERE characters IS NOT NULL
  AND characters != ''
  AND characters::jsonb IS NOT NULL;