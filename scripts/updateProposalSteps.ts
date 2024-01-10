import { Page, Proposal, Space, Vote, VoteStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { getVote } from 'lib/votes/getVote';
import { ExtendedVote } from 'lib/votes/interfaces';

export async function updateProposalSteps({
  spaceDomain,
  templateTitles,
  validateOnly
}: {
  spaceDomain: string;
  templateTitles: string[];
  validateOnly: true;
}) {
  const templates = await prisma.page.findMany({
    where: {
      space: {
        domain: spaceDomain
      },
      type: 'proposal_template',
      title: {
        in: templateTitles
      }
    },
    include: {
      proposal: {
        include: {
          evaluations: true
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
        evaluations: true
      }
    });
    const evaluationIndicesToUpdate: { evaluationId: string; index: number }[] = [];
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
      if (templateEvaluations.length !== proposalEvaluations.length) {
        throw new InvalidInputError('Template evaluations length does not match proposal evaluations length');
      }
      for (const templateEvaluation of templateEvaluations) {
        const proposalEvaluation = proposalEvaluations.find((e) => e.title === templateEvaluation.title);
        if (!proposalEvaluation) {
          console.log('DUMP: template evaluations', templateEvaluations);
          console.log('DUMP: proposal evaluations', proposalEvaluations);
          throw new InvalidInputError('Could not find a matching evaluation for the template evaluation');
        }
        if (proposalEvaluation.index !== templateEvaluation.index) {
          evaluationIndicesToUpdate.push({
            evaluationId: proposalEvaluation.id,
            index: templateEvaluation.index
          });
        } else {
          console.log('Evaluation index is correct', {
            template: templateEvaluation.title,
            templateEval: templateEvaluation.index,
            proposalEval: proposalEvaluation.index
          });
        }
      }
    }
    console.log('Changes to be made', {
      template: template.title,
      proposals: proposals.length,
      evaluationIndicesToUpdate: evaluationIndicesToUpdate.length
    });
  }
}

updateProposalSteps({
  spaceDomain: 'taiko',
  templateTitles: ['Community Track', 'Partner Track', 'RFP-001'],
  validateOnly: true
}).catch(console.error);
