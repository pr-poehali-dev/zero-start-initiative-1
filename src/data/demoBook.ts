// Демо-книга "Маленький принц" — показывается новым пользователям

export const DEMO_BOOK = {
  id: 0, // 0 = демо, не из БД
  title: "Маленький принц",
  genre: "Аллегорическая повесть",
  words: 1240,
  progress: 100,
  lastEdit: "2 недели назад",
};

export const DEMO_WORDS = 1240;
export const DEMO_CHARS = Math.round(DEMO_WORDS * 5.5); // ~6820

// Стата за 14 дней (выдуманная)
export const DEMO_WEEK_WORDS = [280, 0, 320, 190, 0, 250, 200]; // последние 7 дней
export const DEMO_TOTAL_WEEK = DEMO_WEEK_WORDS.reduce((a, b) => a + b, 0);
export const DEMO_STREAK = 14;
