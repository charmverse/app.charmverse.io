import { getLastWeek, getCurrentWeek } from '../dates';

export const randomLargeInt = () => Math.floor(Math.random() * 1000000000) + 1000000000;

export function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// provide a basic season for testing that doesn't rely on the hard-coded "current season"
export const mockSeason = getLastWeek();
export const mockWeek = getCurrentWeek();
