import { usePUT } from '../helpers';

export function useRefreshShareImage() {
  return usePUT<{ builderId?: string }, void>('/api/builders/refresh-congrats');
}
