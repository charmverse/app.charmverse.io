export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const toSec = Math.round(diff / 1000);
  const toMin = Math.round(toSec / 60);
  const toHour = Math.round(toMin / 60);
  const toDays = Math.round(toHour / 24);

  switch (true) {
    case (toSec < 60):
      return 'just now';
    case (toMin < 60):
      return `${toMin}m ago`;
    case (toHour < 24):
      return `${toHour}h ago`;
    case (toDays >= 24 && ((now.getFullYear() - date.getFullYear()) === 0)):
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    default:
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};
