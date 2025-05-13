import { brandColorNames } from 'theme/colors';

export function getRandomThemeColor() {
  const index = Math.floor(Math.random() * brandColorNames.length);

  return brandColorNames[index];
}
