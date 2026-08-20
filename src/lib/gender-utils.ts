// Basic utility to guess gender from Hebrew first name
// Fallback is 'unknown'

const maleNames = new Set([
  'דוד', 'משה', 'יוסף', 'אברהם', 'יעקב', 'יצחק', 'אריאל', 'דניאל', 'נועם', 'איתי', 
  'דני', 'רועי', 'עידו', 'עומר', 'גיא', 'תומר', 'יובל', 'אלעד', 'ליאור', 'עמית',
  'ניר', 'רון', 'טל', 'אורי', 'אור', 'גל', 'שחר', 'בר', 'דור', 'נדב', 'מתן'
]);

const femaleNames = new Set([
  'שרה', 'רחל', 'רבקה', 'לאה', 'מרים', 'חנה', 'אסתר', 'תמר', 'מיכל', 'יעל',
  'מאיה', 'נועה', 'אביגיל', 'איילה', 'שירה', 'רוני', 'טליה', 'עדי', 'הילה', 'יערה',
  'דנה', 'מירי', 'מורן', 'לירון', 'שני', 'מעיין', 'אורטל', 'דקלה', 'רעות', 'חן'
]);

export type Gender = 'male' | 'female' | 'unknown';

export function guessGender(firstName: string): Gender {
  if (!firstName) return 'unknown';
  
  const cleanName = firstName.trim().split(' ')[0]; // Take first word
  
  if (maleNames.has(cleanName)) return 'male';
  if (femaleNames.has(cleanName)) return 'female';
  
  // Can add more heuristics later (e.g., ends with 'ה' or 'ית')
  return 'unknown';
}
