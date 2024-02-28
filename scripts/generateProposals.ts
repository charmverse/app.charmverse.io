import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { getSpace } from 'lib/spaces/getSpace';
import { randomIntFromInterval } from 'lib/utils/random';

const minRubricScore = 0;
const maxRubricScore = 20;

async function generateRubricProposals({ spaceIdOrDomain, amount }: { spaceIdOrDomain: string; amount: number }) {
  const space = await getSpace(spaceIdOrDomain);

  for (let i = 0; i < amount; i++) {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: space.createdBy,
      proposalStatus: 'published',
      authors: [space.createdBy],
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          reviewers: [{ group: 'user', id: space.createdBy }],
          permissions: [{ assignee: { group: 'space_member' }, operation: 'view' }],
          rubricCriteria: [
            {
              title: 'test',
              description: 'test',
              parameters: { type: 'range', min: minRubricScore, max: maxRubricScore }
            }
          ]
        }
      ]
    });

    const evaluation = await prisma.proposalEvaluation.findFirstOrThrow({
      where: {
        proposalId: proposal.id
      },
      include: {
        rubricCriteria: true
      }
    });

    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        userId: space.createdBy,
        comment: 'test',
        evaluation: { connect: { id: evaluation.id } },
        proposal: { connect: { id: proposal.id } },
        rubricCriteria: {
          connect: {
            id: evaluation.rubricCriteria[0].id
          }
        },
        response: {
          score: randomIntFromInterval(minRubricScore, maxRubricScore)
        }
      }
    });
  }
}

// prisma.proposal.deleteMany({
//   where: {
//     space: {
//       domain: 'urgent-teal-piranha'
//     }
//   }
// }).then(console.log)

generateRubricProposals({ amount: 15, spaceIdOrDomain: 'urgent-teal-piranha' });
