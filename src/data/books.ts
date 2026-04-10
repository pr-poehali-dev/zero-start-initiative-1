export const books = [
  {
    id: 1,
    title: "Осколки неба",
    genre: "Фэнтези",
    words: 34210,
    progress: 68,
    lastEdit: "сегодня",
    goalChars: 300000,
  },
  {
    id: 2,
    title: "Письма без адреса",
    genre: "Современная проза",
    words: 12750,
    progress: 25,
    lastEdit: "вчера",
    goalChars: 100000,
  },
  {
    id: 3,
    title: "Сад ночных цветов",
    genre: "Магический реализм",
    words: 51800,
    progress: 91,
    lastEdit: "3 дня назад",
    goalChars: 320000,
  },
];

export const totalWords = books.reduce((sum, b) => sum + b.words, 0);
export const totalChars = Math.round(totalWords * 5.5);
export const wordsToChars = (words: number) => Math.round(words * 5.5);
