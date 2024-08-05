import { v4 as uuid } from 'uuid';

export type RangeProposalCriteria = {
  id: string;
  index: number;
  title: string;
  description?: string | null;
  type: 'range';
  parameters: { min: number | null; max: number | null };
};

export function getNewCriteria({ parameters }: Partial<RangeProposalCriteria> = {}): RangeProposalCriteria {
  return {
    id: uuid(),
    index: -1,
    description: '',
    title: '',
    type: 'range',
    parameters: parameters || { min: 1, max: 5 }
  };
}
