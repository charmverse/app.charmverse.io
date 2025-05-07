import { ProposalReviewer } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/utils/errors';

export async function updateProposalSteps({ spaceDomain }: { spaceDomain: string }) {
  const templates = await prisma.page.findMany({
    where: {
      space: {
        domain: spaceDomain
      },
      type: 'proposal_template'
    },
    include: {
      proposal: {
        include: {
          evaluations: {
            include: {
              rubricCriteria: true,
              reviewers: true
            }
          }
        }
      }
    }
  });

  for (let template of templates) {
    const proposals = await prisma.proposal.findMany({
      where: {
        page: {
          sourceTemplateId: template.id
        }
      },
      include: {
        evaluations: {
          include: {
            rubricCriteria: true,
            reviewers: true
          }
        }
      }
    });
    const evaluationIndicesToUpdate: { id: string; index: number }[] = [];
    const reviewersToSet: { evaluationId: string; reiewers: ProposalReviewer[] }[] = [];
    let proposalsToUpdate = new Set();
    for (let proposal of proposals) {
      // Match the evaluations of each proposal with the template evaluations and make sure the index is correct
      const templateEvaluations = template.proposal?.evaluations;
      const proposalEvaluations = proposal.evaluations;
      if (!templateEvaluations) {
        throw new DataNotFoundError('Template evaluations not found');
      }
      if (!proposalEvaluations) {
        throw new DataNotFoundError('Proposal evaluations not found');
      }
      // if (templateEvaluations.length !== proposalEvaluations.length) {
      //   throw new InvalidInputError('Template evaluations length does not match proposal evaluations length');
      // }
      // let hasMatch = 0;
      // let hasCorrectIndex = 0;
      // templateEvaluations.forEach((templateEvaluation) => {
      //   const match = proposalEvaluations.find((e) => e.title === templateEvaluation.title);
      //   if (match) {
      //     hasMatch++;
      //   }
      //   if (match?.index === templateEvaluation.index) {
      //     hasCorrectIndex++;
      //   }
      // });
      // const everyStepHasMatch = hasMatch === templateEvaluations.length;
      // // if (hasMatch === templateEvaluations.length && hasCorrectIndex !== templateEvaluations.length) {
      // //   console.log('Fix indicies', {
      // //     template: template.title,
      // //     proposal: proposal.title
      // //   });
      // //   continue;
      // // }
      for (const templateEvaluation of templateEvaluations) {
        const proposalEvaluation = proposalEvaluations.find((e) => e.title === templateEvaluation.title);
        if (!proposalEvaluation) {
          continue;
        }
        if (proposalEvaluation.type === 'rubric') {
          const everyCriteriaHasMatch = templateEvaluation.rubricCriteria.every((criteria) =>
            proposalEvaluation.rubricCriteria.some((c) => c.title === criteria.title)
          );
          if (!everyCriteriaHasMatch) {
            throw new Error('Invalid criteria match');
          }
          for (const criteria of templateEvaluation.rubricCriteria) {
            // compare index to matching criteria from proposal
            const match = proposalEvaluation.rubricCriteria.find((c) => c.title === criteria.title);
            if (criteria.index !== match!.index) {
              evaluationIndicesToUpdate.push({
                id: match!.id,
                index: criteria.index
              });
              proposalsToUpdate.add(proposal.id);
            }
          }
        }
        const sameReviewers =
          templateEvaluation.reviewers.length === proposalEvaluation.reviewers.length &&
          templateEvaluation.reviewers.every((reviewer) => {
            return proposalEvaluation.reviewers.some(
              (r) =>
                r.userId === reviewer.userId || r.roleId === reviewer.roleId || r.systemRole === reviewer.systemRole
            );
          });
        if (!sameReviewers) {
          reviewersToSet.push({
            evaluationId: proposalEvaluation.id,
            reiewers: templateEvaluation.reviewers
          });
          proposalsToUpdate.add(proposal.id);
        }
      }
    }
    console.log('Changes to be made', {
      template: template.title,
      proposals: proposals.length,
      proposalsToUpdate: proposalsToUpdate.size,
      evaluationIndicesToUpdate: evaluationIndicesToUpdate.length,
      reviewersToSet: reviewersToSet.length
    });
    // await Promise.all(
    //   evaluationIndicesToUpdate.map((e) =>
    //     prisma.proposalRubricCriteria.update({ where: { id: e.id }, data: { index: e.index } })
    //   )
    // );
  }
}

updateProposalSteps({
  spaceDomain: 'your space domain here'
}).catch(console.error);
