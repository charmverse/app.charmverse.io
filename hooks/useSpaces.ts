import { useLocalStorage } from './useLocalStorage';
import { Space } from 'models';
import { spaces } from 'seedData';

export function useSpaces () {
  return useLocalStorage<Space[]>(`charm.v1.spaces`, spaces);
};