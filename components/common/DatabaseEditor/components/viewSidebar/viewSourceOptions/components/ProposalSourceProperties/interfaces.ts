export type RubricEvaluationProperty =
  | 'average'
  | 'total'
  | 'reviewers'
  | 'criteriaTotal'
  | 'reviewerScore'
  | 'reviewerComment'
  | 'criteriaAverage'
  | 'reviewerAverage';

export type SelectedProposalProperties = {
  projectMember: string[];
  project: string[];
  customProperties: string[];
  templateProperties: {
    templateId: string;
    rubricEvaluations: {
      title: string;
      properties: RubricEvaluationProperty[];
      evaluationId: string;
    }[];
    formFields: string[];
  }[];
  defaults: string[];
};
