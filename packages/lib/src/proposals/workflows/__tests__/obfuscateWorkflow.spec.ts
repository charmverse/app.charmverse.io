import type { ProposalEvaluationType } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';

import { obfuscateWorkflow } from '../obfuscateWorkflow';

describe('obfuscateWorkflow', () => {
  const feedback1Evaluation: WorkflowEvaluationJson = {
    id: '1a',
    type: 'feedback',
    title: 'Feedback',
    permissions: [],
    actionLabels: { approve: 'Yes', reject: 'No' }
  };
  const feedback2Evaluation: WorkflowEvaluationJson = {
    id: '1b',
    type: 'feedback',
    title: 'Feedback',
    permissions: [],
    actionLabels: { approve: 'Yes', reject: 'No' }
  };

  const rubric1Evaluation: WorkflowEvaluationJson = {
    id: '2',
    type: 'rubric',
    title: 'Rubric 1',
    permissions: [],
    actionLabels: null
  };

  const rubric2Evaluation: WorkflowEvaluationJson = {
    id: '3',
    type: 'rubric',
    title: 'Rubric 2',
    permissions: [],
    actionLabels: null
  };

  const voteEvaluation: WorkflowEvaluationJson = {
    id: '4',
    type: 'vote',
    title: 'Vote',
    permissions: [],
    actionLabels: null
  };

  const passFail1Evaluation: WorkflowEvaluationJson = {
    id: '5',
    type: 'pass_fail',
    title: 'Pass fail 1',
    permissions: [],
    actionLabels: null
  };

  const passFail2Evaluation: WorkflowEvaluationJson = {
    id: '6',
    type: 'pass_fail',
    title: 'Pass fail 2',
    permissions: [],
    actionLabels: null
  };

  it('should return the input evaluations unchanged when none are concealable', () => {
    const evaluations = [{ ...feedback1Evaluation }, { ...feedback2Evaluation }];
    const result = obfuscateWorkflow({ evaluations });
    expect(result).toEqual(evaluations);
  });

  it('should collapse consecutive concealable evaluations into a single private evaluation', () => {
    const evaluations = [{ ...feedback1Evaluation }, { ...passFail1Evaluation }, { ...passFail2Evaluation }]; // Both are concealable
    const expected = [
      {
        ...feedback1Evaluation
      },
      {
        id: passFail1Evaluation.id, // Expect the ID of the first concealable evaluation
        permissions: [],
        title: 'Evaluation',
        type: 'private_evaluation' as ProposalEvaluationType,
        actionLabels: null
      }
    ];

    const result = obfuscateWorkflow({ evaluations });
    expect(result).toEqual(expected);
  });

  it('should handle mixed sequences of concealable and non-concealable evaluations', () => {
    const evaluations = [
      { ...passFail1Evaluation },
      { ...passFail2Evaluation },
      { ...feedback2Evaluation },
      { ...feedback1Evaluation },
      { ...voteEvaluation },
      { ...rubric1Evaluation },
      { ...rubric2Evaluation }
    ];
    const expected = [
      {
        id: passFail1Evaluation.id, // Expect the ID of the first concealable evaluation
        permissions: [],
        title: 'Evaluation',
        type: 'private_evaluation' as ProposalEvaluationType,
        actionLabels: null
      },
      { ...feedback2Evaluation },
      { ...feedback1Evaluation },
      {
        id: voteEvaluation.id, // Expect the ID of the first concealable evaluation
        permissions: [],
        title: 'Evaluation',
        type: 'private_evaluation' as ProposalEvaluationType,
        actionLabels: null
      }
    ];

    const result = obfuscateWorkflow({ evaluations });
    expect(result).toEqual(expected);
  });

  it('should return an empty array when the input evaluations array is empty', () => {
    const evaluations = [] as WorkflowEvaluationJson[];
    const result = obfuscateWorkflow({ evaluations });
    expect(result).toEqual([]);
  });
});
