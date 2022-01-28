import { useLocalStorage } from './useLocalStorage';
import { Page } from 'models';
import { pages } from 'seedData';
import { useSpace } from './useSpace';

export function usePages () {
  const [space] = useSpace();
  const spacePages = pages.filter(c => c.spaceId  === space.id);
  console.log('space', space, spacePages)
  return useLocalStorage<Page[]>(`spaces.${space.id}.pages`, spacePages);
};