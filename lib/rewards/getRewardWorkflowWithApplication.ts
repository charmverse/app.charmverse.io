import type { RewardEvaluation, RewardWorkflow } from './getRewardWorkflows';
import type { ApplicationWithTransactions } from './interfaces';

export function getRewardWorkflowWithApplication({
  applicationStatus,
  workflow,
  hasCredentials,
  hasIssuableOnchainCredentials,
  kycStatus
}: {
  workflow: RewardWorkflow;
  applicationStatus?: ApplicationWithTransactions['status'];
  hasCredentials: boolean;
  hasIssuableOnchainCredentials?: boolean;
  kycStatus?: boolean | null;
}): RewardWorkflow {
  const evaluations: RewardEvaluation[] = workflow.evaluations.filter((evaluation) => {
    if (evaluation.type === 'credential' && !hasCredentials) {
      return false;
    }

    return true;
  });

  if (!applicationStatus) {
    return {
      ...workflow,
      evaluations: evaluations.map((evaluation) => {
        return {
          ...evaluation,
          result: null
        };
      })
    };
  }

  switch (applicationStatus) {
    case 'applied': {
      const applyStepIndex = evaluations.findIndex((evaluation) => evaluation.type === 'apply');
      return {
        ...workflow,
        evaluations: evaluations.map((evaluation, index) => {
          if (evaluation.type === 'apply') {
            return {
              ...evaluation,
              result: 'pass'
            };
          }

          return {
            ...evaluation,
            result: index < applyStepIndex ? 'pass' : null
          };
        })
      };
    }
    case 'rejected': {
      const applicationReviewStepIndex = evaluations.findIndex(
        (evaluation) => evaluation.type === 'application_review'
      );
      return {
        ...workflow,
        evaluations: evaluations.map((evaluation, index) => {
          if (evaluation.type === 'application_review') {
            return {
              ...evaluation,
              result: 'fail'
            };
          }

          return {
            ...evaluation,
            result: index < applicationReviewStepIndex ? 'pass' : null
          };
        })
      };
    }

    case 'submission_rejected': {
      const submissionReviewStepIndex = evaluations.findIndex((evaluation) => evaluation.type === 'review');
      return {
        ...workflow,
        evaluations: evaluations.map((evaluation, index) => {
          if (evaluation.type === 'review') {
            return {
              ...evaluation,
              result: 'fail'
            };
          }

          return {
            ...evaluation,
            result: index < submissionReviewStepIndex ? 'pass' : null
          };
        })
      };
    }

    case 'inProgress': {
      const submitStepIndex = evaluations.findIndex((evaluation) => evaluation.type === 'submit');
      return {
        ...workflow,
        evaluations: evaluations.map((evaluation, index) => {
          if (evaluation.type === 'submit') {
            return {
              ...evaluation,
              result: null
            };
          }

          return {
            ...evaluation,
            result: index < submitStepIndex ? 'pass' : null
          };
        })
      };
    }

    case 'review': {
      const reviewStepIndex = evaluations.findIndex((evaluation) => evaluation.type === 'review');
      return {
        ...workflow,
        evaluations: evaluations.map((evaluation, index) => {
          if (evaluation.type === 'review') {
            return {
              ...evaluation,
              result: null
            };
          }

          return {
            ...evaluation,
            result: index < reviewStepIndex ? 'pass' : null
          };
        })
      };
    }

    case 'complete':
    case 'processing': {
      if (hasIssuableOnchainCredentials && applicationStatus !== 'processing') {
        const credentialStepIndex = evaluations.findIndex((evaluation) => evaluation.type === 'credential');
        return {
          ...workflow,
          evaluations: evaluations.map((evaluation, index) => {
            if (evaluation.type === 'credential') {
              return {
                ...evaluation,
                result: null
              };
            }

            return {
              ...evaluation,
              result: index < credentialStepIndex ? 'pass' : null
            };
          })
        };
      }
      const paymentStepIndex = evaluations.findIndex((evaluation) => evaluation.type === 'payment');
      return {
        ...workflow,
        evaluations: evaluations.map((evaluation, index) => {
          if (evaluation.type === 'kyc') {
            if (kycStatus === null) {
              return {
                ...evaluation,
                result: null
              };
            }

            return {
              ...evaluation,
              result: kycStatus ? 'pass' : 'fail'
            };
          }
          if (evaluation.type === 'payment') {
            return {
              ...evaluation,
              result: null
            };
          }

          return {
            ...evaluation,
            result: index < paymentStepIndex ? 'pass' : null
          };
        })
      };
    }

    case 'paid': {
      return {
        ...workflow,
        evaluations: evaluations.map((evaluation) => {
          return {
            ...evaluation,
            result: 'pass'
          };
        })
      };
    }

    case 'cancelled': {
      return {
        ...workflow,
        evaluations: evaluations.map((evaluation) => {
          return {
            ...evaluation,
            result: evaluation.type === 'payment' ? 'fail' : 'pass'
          };
        })
      };
    }

    default: {
      return workflow;
    }
  }
}
