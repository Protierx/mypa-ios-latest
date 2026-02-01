export const getAIResponse = (text: string): string => {
  const t = text.toLowerCase();
  if (t.includes('overwhelm') || t.includes('too much')) {
    return "I hear you. When everything feels like too much, the bravest thing is to pause. What's weighing on you most?";
  }
  if (t.includes('vent') || t.includes('frustrated') || t.includes('angry')) {
    return "I'm here. No advice, no judgment — just listening. Let it out.";
  }
  if (t.includes('help') || t.includes('think') || t.includes('figure')) {
    return "Let's untangle this together. Is it one thing, or does everything feel heavy right now?";
  }
  return "I'm listening. Take your time.";
};
