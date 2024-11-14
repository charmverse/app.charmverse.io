import { usePUT } from '../helpers';

export function useRefreshCongratsImage() {
  return usePUT<{ builderId?: string }, void>('/api/builders/refresh-congrats');
}
