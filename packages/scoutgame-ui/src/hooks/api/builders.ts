import { usePUT } from '@packages/scoutgame-ui/hooks/helpers';

export function useRefreshCongratsImage() {
  return usePUT<{ builderId?: string }, void>('/api/builders/refresh-congrats');
}
