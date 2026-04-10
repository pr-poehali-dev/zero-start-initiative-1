// Демо-данные для нового пользователя — одна тестовая книга
export const books = [
  {
    id: 0,
    title: "Маленький принц",
    genre: "Аллегорическая повесть",
    words: 1240,
    progress: 100,
    lastEdit: "2 недели назад",
    goalChars: 7000,
  },
];

export const totalWords = 1240;
export const totalChars = 6820;
// words в БД теперь хранит знаки с пробелами напрямую
export const wordsToChars = (chars: number) => chars;