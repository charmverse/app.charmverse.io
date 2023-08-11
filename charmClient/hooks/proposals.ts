import type { RubricAnswerUpsert } from 'lib/proposal/rubric/upsertRubricAnswers';
import type { RubricCriteriaUpsert } from 'lib/proposal/rubric/upsertRubricCriteria';

import { usePUT } from './helpers';

export function useUpsertRubricCriteria({ proposalId }: { proposalId: string }) {
  return usePUT<Pick<RubricCriteriaUpsert, 'rubricCriteria'>>(`/api/proposals/${proposalId}/rubric-criteria`);
}

export function useUpsertRubricCriteriaAnswer({ proposalId }: { proposalId?: string }) {
  return usePUT<Pick<RubricAnswerUpsert, 'answers'>>(`/api/proposals/${proposalId}/rubric-answers`);
}
