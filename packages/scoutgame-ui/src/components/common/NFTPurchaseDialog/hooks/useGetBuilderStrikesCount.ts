import { useGETImmutable } from '../../../../hooks/helpers';

export function useGetBuilderStrikesCount({ builderId }: { builderId: string }) {
  return useGETImmutable<number>(`/api/builders/strikes-count`, { builderId });
}
