import { useLocalStorage } from './useLocalStorage';
import { Page } from 'models';
import { pages } from 'seedData';
import { useSpace } from './useSpace';

export function usePages () {
  const [space] = useSpace();
  const spacePages = pages.filter(c => c.spaceId  === space.id);
  return useLocalStorage<Page[]>(`spaces.${space.id}.pages`, spacePages);
};