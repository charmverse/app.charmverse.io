import { Contributor } from 'models';
import { activeUser } from 'seedData';
import { useLocalStorage } from './useLocalStorage';

export function useUser () {
  return useLocalStorage<Contributor>(`charm.v1.space.profile`, activeUser);

};