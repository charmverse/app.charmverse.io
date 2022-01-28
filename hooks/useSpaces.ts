import { useLocalStorage, PREFIX } from './useLocalStorage';
import { Space } from 'models';
import { spaces } from 'seedData';

export function useSpaces () {
  return useLocalStorage<Space[]>(`${PREFIX}.spaces`, spaces);
};