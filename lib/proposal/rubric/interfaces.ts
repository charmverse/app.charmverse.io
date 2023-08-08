import { ProposalRubricCriteria, ProposalRubricCriteriaType } from "@charmverse/core/prisma-client";


export type RubricRangeParameters = {
  min: number;
  max: number;
}

export type ProposalRubricParameterMap = {
  'range': RubricRangeParameters
}

export type ProposalRubricCriteriaParams<T extends ProposalRubricCriteriaType> = {
  type: T;
  parameters: ProposalRubricParameterMap[T]
}

export type ProposalRubricCriteriaWithTypedParams<T extends ProposalRubricCriteriaType = ProposalRubricCriteriaType> = ProposalRubricCriteria & ProposalRubricCriteriaParams<T>