import { getLastWeek } from '../dates';

export const randomLargeInt = () => Math.floor(Math.random() * 1000000000) + 1000000000;

// provide a basic season for testing that doesn't rely on the hard-coded "current season"
export const mockSeason = getLastWeek();
