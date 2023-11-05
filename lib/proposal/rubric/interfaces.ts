import type {
  ProposalRubricCriteria,
  ProposalRubricCriteriaAnswer,
  ProposalRubricCriteriaType
} from '@charmverse/core/prisma-client';

export type RubricRangeParameters = {
  min: number;
  max: number;
};

export type ProposalRubricParameterMap = {
  range: RubricRangeParameters;
};

export type ProposalRubricCriteriaParams<T extends ProposalRubricCriteriaType> = {
  type: T;
  parameters: ProposalRubricParameterMap[T];
};

export type ProposalRubricCriteriaWithTypedParams<T extends ProposalRubricCriteriaType = ProposalRubricCriteriaType> =
  Omit<ProposalRubricCriteria, 'type' | 'parameters'> & ProposalRubricCriteriaParams<T>;

// Answer types
export type RubricRangeAnswer = {
  score: number;
};

export type ProposalRubricAnswerMap = {
  range: RubricRangeAnswer;
};

export type ProposalRubricCriteriaResponse<T extends ProposalRubricCriteriaType> = {
  response: ProposalRubricAnswerMap[T];
};

export type ProposalRubricCriteriaAnswerWithTypedResponse<
  T extends ProposalRubricCriteriaType = ProposalRubricCriteriaType
> = Omit<ProposalRubricCriteriaAnswer, 'response'> & ProposalRubricCriteriaResponse<T>;
