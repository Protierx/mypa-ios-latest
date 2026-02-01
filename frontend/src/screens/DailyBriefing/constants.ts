import { Quote } from './types';

export const MORNING_QUOTES: Quote[] = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Every morning brings new potential.", author: "Unknown" },
  { text: "Today is a new day. Don't let your history interfere with your destiny.", author: "Steve Maraboli" },
  { text: "The early bird catches the worm, but the second mouse gets the cheese.", author: "Willie Nelson" },
  { text: "Rise up, start fresh, see the bright opportunity in each new day.", author: "Unknown" },
];

export const AFTERNOON_QUOTES: Quote[] = [
  { text: "It's not about having time, it's about making time.", author: "Unknown" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

export const EVENING_QUOTES: Quote[] = [
  { text: "Reflect upon your present blessings, of which every man has many.", author: "Charles Dickens" },
  { text: "Each day provides its own gifts.", author: "Marcus Aurelius" },
  { text: "Rest when you're weary. Refresh and renew yourself.", author: "Ralph Marston" },
  { text: "Finish each day and be done with it.", author: "Ralph Waldo Emerson" },
  { text: "Tomorrow is a new day; begin it well.", author: "Ralph Waldo Emerson" },
];

export const CATEGORY_EMOJIS: Record<string, string> = {
  Work: '💼',
  Personal: '🏠',
  Health: '💪',
  Finance: '💰',
  Learning: '📚',
  Social: '👥',
};
