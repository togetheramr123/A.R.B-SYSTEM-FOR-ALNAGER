export const CHAOS_STRINGS = [
  "", // Empty string
  "   ", // Whitespace only
  "نص عربي طويل جداً جداً جداً لتجربة كيف يتعامل النظام مع النصوص التي تتجاوز الطول المسموح وتكسر التصميم إذا لم يكن هناك تقصير للنص", 
  "!@#$%^&*()_+{}|:\"<>?~`-=[]\\;',./", // Special characters
  "Drop Table Users;", // SQL Injection attempt
  "<script>alert('XSS')</script>", // XSS attempt
  "😊😂🤣❤️😍 (Emojis)", // Emojis and Unicode
  "A".repeat(1000), // 1000 character long string
];

export const CHAOS_NUMBERS = [
  0,
  -1,
  -999999,
  999999999999999, // Very large number
  0.0000000001, // Very small decimal
  NaN,
  Infinity,
];

export const CHAOS_EMAILS = [
  "plainaddress",
  "#@%^%#$@#$@#.com",
  "@example.com",
  "Joe Smith <email@example.com>",
  "email.example.com",
  "email@example@example.com",
  "email@111.222.333.44444",
];

export const EDGE_CASE_DATES = [
  "2000-01-01",
  "2099-12-31",
  "0000-00-00", // Invalid date format often breaking databases
  "2024-02-30", // Invalid leap year date
  new Date(8640000000000000).toISOString(), // Max valid date in JS
];

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
