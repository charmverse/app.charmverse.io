import { Contributor } from 'models';
import { activeUser } from 'seedData';
import { useLocalStorage, PREFIX } from './useLocalStorage';

export function useUser () {
  return useLocalStorage<Contributor>(`${PREFIX}.space.profile`, activeUser);

};