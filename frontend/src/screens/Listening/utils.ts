export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning! How can I help you today?";
  if (hour < 17) return "Good afternoon! What would you like to do?";
  return "Good evening! How can I assist you?";
};
