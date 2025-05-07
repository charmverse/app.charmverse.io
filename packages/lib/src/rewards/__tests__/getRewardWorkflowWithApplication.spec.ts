import {
  applicationRequiredWorkflow,
  directSubmissionWorkflow,
  rewardApplicationReviewEvaluation,
  rewardApplyEvaluation,
  rewardCredentialEvaluation,
  rewardPaymentEvaluation,
  rewardReviewEvaluation,
  rewardSubmitEvaluation
} from '../getRewardWorkflows';
import { getRewardWorkflowWithApplication } from '../getRewardWorkflowWithApplication';

describe('getRewardWorkflowWithApplication', () => {
  it(`Should return workflow with correct evaluations result without any application status`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: applicationRequiredWorkflow,
      hasCredentials: true,
      hasIssuableOnchainCredentials: false,
      applicationStatus: undefined
    });

    expect(result).toStrictEqual({
      ...applicationRequiredWorkflow,
      evaluations: [
        {
          ...rewardApplyEvaluation,
          result: null
        },
        {
          ...rewardApplicationReviewEvaluation,
          result: null
        },
        {
          ...rewardSubmitEvaluation,
          result: null
        },
        {
          ...rewardReviewEvaluation,
          result: null
        },
        {
          ...rewardCredentialEvaluation,
          result: null
        },
        {
          ...rewardPaymentEvaluation,
          result: null
        }
      ]
    });
  });

  it(`Should return workflow with correct evaluations result without any application status for a workflow that has no credentials`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: applicationRequiredWorkflow,
      hasCredentials: false,
      hasIssuableOnchainCredentials: false,
      applicationStatus: undefined
    });

    expect(result).toStrictEqual({
      ...applicationRequiredWorkflow,
      evaluations: [
        {
          ...rewardApplyEvaluation,
          result: null
        },
        {
          ...rewardApplicationReviewEvaluation,
          result: null
        },
        {
          ...rewardSubmitEvaluation,
          result: null
        },
        {
          ...rewardReviewEvaluation,
          result: null
        },
        {
          ...rewardPaymentEvaluation,
          result: null
        }
      ]
    });
  });

  it(`Should return workflow with correct evaluations result for applied application`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: applicationRequiredWorkflow,
      hasCredentials: true,
      hasIssuableOnchainCredentials: false,
      applicationStatus: 'applied'
    });

    expect(result).toStrictEqual({
      ...applicationRequiredWorkflow,
      evaluations: [
        {
          ...rewardApplyEvaluation,
          result: 'pass'
        },
        {
          ...rewardApplicationReviewEvaluation,
          result: null
        },
        {
          ...rewardSubmitEvaluation,
          result: null
        },
        {
          ...rewardReviewEvaluation,
          result: null
        },
        {
          ...rewardCredentialEvaluation,
          result: null
        },
        {
          ...rewardPaymentEvaluation,
          result: null
        }
      ]
    });
  });

  it(`Should return workflow with correct evaluations result for rejected application`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: applicationRequiredWorkflow,
      hasCredentials: true,
      hasIssuableOnchainCredentials: false,
      applicationStatus: 'rejected'
    });

    expect(result).toStrictEqual({
      ...applicationRequiredWorkflow,
      evaluations: [
        {
          ...rewardApplyEvaluation,
          result: 'pass'
        },
        {
          ...rewardApplicationReviewEvaluation,
          result: 'fail'
        },
        {
          ...rewardSubmitEvaluation,
          result: null
        },
        {
          ...rewardReviewEvaluation,
          result: null
        },
        {
          ...rewardCredentialEvaluation,
          result: null
        },
        {
          ...rewardPaymentEvaluation,
          result: null
        }
      ]
    });
  });

  it(`Should return workflow with correct evaluations result passed for rejected submission`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: applicationRequiredWorkflow,
      hasCredentials: false,
      hasIssuableOnchainCredentials: false,
      applicationStatus: 'submission_rejected'
    });

    expect(result).toStrictEqual({
      ...applicationRequiredWorkflow,
      evaluations: [
        {
          ...rewardApplyEvaluation,
          result: 'pass'
        },
        {
          ...rewardApplicationReviewEvaluation,
          result: 'pass'
        },
        {
          ...rewardSubmitEvaluation,
          result: 'pass'
        },
        {
          ...rewardReviewEvaluation,
          result: 'fail'
        },
        {
          ...rewardPaymentEvaluation,
          result: null
        }
      ]
    });
  });

  it(`Should return workflow with correct evaluations result for inProgress submission`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: directSubmissionWorkflow,
      hasCredentials: false,
      hasIssuableOnchainCredentials: false,
      applicationStatus: 'inProgress'
    });

    expect(result).toStrictEqual({
      ...directSubmissionWorkflow,
      evaluations: [
        {
          ...rewardSubmitEvaluation,
          result: null
        },
        {
          ...rewardReviewEvaluation,
          result: null
        },
        {
          ...rewardPaymentEvaluation,
          result: null
        }
      ]
    });
  });

  it(`Should return workflow with correct evaluations result for review submission`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: directSubmissionWorkflow,
      hasCredentials: false,
      hasIssuableOnchainCredentials: false,
      applicationStatus: 'review'
    });

    expect(result).toStrictEqual({
      ...directSubmissionWorkflow,
      evaluations: [
        {
          ...rewardSubmitEvaluation,
          result: 'pass'
        },
        {
          ...rewardReviewEvaluation,
          result: null
        },
        {
          ...rewardPaymentEvaluation,
          result: null
        }
      ]
    });
  });

  it(`Should return workflow with correct evaluations result for complete submission with onchain credentials`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: directSubmissionWorkflow,
      hasCredentials: true,
      hasIssuableOnchainCredentials: true,
      applicationStatus: 'complete'
    });

    expect(result).toStrictEqual({
      ...directSubmissionWorkflow,
      evaluations: [
        {
          ...rewardSubmitEvaluation,
          result: 'pass'
        },
        {
          ...rewardReviewEvaluation,
          result: 'pass'
        },
        {
          ...rewardCredentialEvaluation,
          result: null
        },
        {
          ...rewardPaymentEvaluation,
          result: null
        }
      ]
    });
  });

  it(`Should return workflow with correct evaluations result for processing submission without onchain credentials`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: directSubmissionWorkflow,
      hasCredentials: false,
      hasIssuableOnchainCredentials: false,
      applicationStatus: 'processing'
    });

    expect(result).toStrictEqual({
      ...directSubmissionWorkflow,
      evaluations: [
        {
          ...rewardSubmitEvaluation,
          result: 'pass'
        },
        {
          ...rewardReviewEvaluation,
          result: 'pass'
        },
        {
          ...rewardPaymentEvaluation,
          result: null
        }
      ]
    });
  });

  it(`Should return workflow with correct evaluations result for paid submission with onchain credentials`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: directSubmissionWorkflow,
      hasCredentials: false,
      hasIssuableOnchainCredentials: false,
      applicationStatus: 'paid'
    });

    expect(result).toStrictEqual({
      ...directSubmissionWorkflow,
      evaluations: [
        {
          ...rewardSubmitEvaluation,
          result: 'pass'
        },
        {
          ...rewardReviewEvaluation,
          result: 'pass'
        },
        {
          ...rewardPaymentEvaluation,
          result: 'pass'
        }
      ]
    });
  });

  it(`Should return workflow with correct evaluations result for cancelled submission with onchain credentials`, () => {
    const result = getRewardWorkflowWithApplication({
      workflow: directSubmissionWorkflow,
      hasCredentials: false,
      hasIssuableOnchainCredentials: false,
      applicationStatus: 'cancelled'
    });

    expect(result).toStrictEqual({
      ...directSubmissionWorkflow,
      evaluations: [
        {
          ...rewardSubmitEvaluation,
          result: 'pass'
        },
        {
          ...rewardReviewEvaluation,
          result: 'pass'
        },
        {
          ...rewardPaymentEvaluation,
          result: 'fail'
        }
      ]
    });
  });
});
