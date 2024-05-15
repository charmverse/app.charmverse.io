import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {

  const proposals = await prisma.proposal.findMany({
    where: {
      space: {domain: 'op-grants'},
    },
    select: {
      status: true,
      archived: true,
      evaluations: {
        select: {
          index: true,
          result: true,
          type: true,
        }
      }
    }
  });

  const totalProposals = proposals.length;

  const proposalsByStatus = proposals.reduce((acc, proposal) => {

    if (proposal.archived) {
      acc.archived++;
      return acc;
    } 


    if (proposal.status === 'draft') {
      acc.draft++;
      return acc;
    }

    const currentStep = getCurrentEvaluation(proposal.evaluations);

    if (currentStep) {
       if (currentStep.result === 'pass') {
        acc.pass++;
      } else if (currentStep.result === 'fail') {
        acc.fail++;
      } else if (currentStep.result === null) {
        acc.pending++;
      } 
    }

    return acc;

  }, {draft: 0, pending: 0, pass: 0, fail: 0, archived: 0});

  console.log('Total proposals:', totalProposals);
  console.log('Proposals by status:', proposalsByStatus);

}
search().then(() => console.log('Done'));
