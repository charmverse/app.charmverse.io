import type { RewardWorkflow } from 'pages/api/spaces/[id]/rewards/workflows';

import type { ApplicationWithTransactions } from './interfaces';

export function getRewardWorkflowWithApplication({
  application,
  workflow
}: {
  workflow: RewardWorkflow;
  application: ApplicationWithTransactions;
}): RewardWorkflow {
  const applicationStatus = application.status;
  switch (applicationStatus) {
    case 'applied': {
      return workflow;
    }
    case 'rejected': {
      const applicationReviewStepIndex = workflow.evaluations.findIndex(
        (evaluation) => evaluation.type === 'application_review'
      );
      return {
        ...workflow,
        evaluations: workflow.evaluations.map((evaluation, index) => {
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
      const submissionReviewStepIndex = workflow.evaluations.findIndex((evaluation) => evaluation.type === 'review');
      return {
        ...workflow,
        evaluations: workflow.evaluations.map((evaluation, index) => {
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
      const submitStepIndex = workflow.evaluations.findIndex((evaluation) => evaluation.type === 'submit');
      return {
        ...workflow,
        evaluations: workflow.evaluations.map((evaluation, index) => {
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
      const reviewStepIndex = workflow.evaluations.findIndex((evaluation) => evaluation.type === 'review');
      return {
        ...workflow,
        evaluations: workflow.evaluations.map((evaluation, index) => {
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
      const paymentStepIndex = workflow.evaluations.findIndex((evaluation) => evaluation.type === 'payment');
      return {
        ...workflow,
        evaluations: workflow.evaluations.map((evaluation, index) => {
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
        evaluations: workflow.evaluations.map((evaluation) => {
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
        evaluations: workflow.evaluations.map((evaluation) => {
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
