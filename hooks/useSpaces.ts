import { useLocalStorage } from './useLocalStorage';
import { Space } from 'models';
import { spaces } from 'seedData';

export function useSpaces () {
  return useLocalStorage<Space[]>(`spaces`, spaces);
};