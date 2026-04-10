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
export const totalChars = Math.round(1240 * 5.5); // ~6820
export const wordsToChars = (words: number) => Math.round(words * 5.5);
