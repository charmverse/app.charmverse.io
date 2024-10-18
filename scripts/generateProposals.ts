import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { getSpace } from 'lib/spaces/getSpace';
import { randomIntFromInterval } from 'lib/utils/random';

const minRubricScore = 0;
const maxRubricScore = 20;

async function generateRubricProposals({
  spaceIdOrDomain,
  amount,
  complete,
  selectedCredentialTemplateIds
}: {
  spaceIdOrDomain: string;
  amount: number;
  complete?: boolean;
  selectedCredentialTemplateIds?: string[];
}) {
  const space = await getSpace(spaceIdOrDomain);

  for (let i = 0; i < amount; i++) {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: space.createdBy,
      proposalStatus: 'published',
      authors: [space.createdBy],
      title: `Proposal ${i}`,
      selectedCredentialTemplateIds,
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
          ],
          result: complete ? 'pass' : undefined
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
        user: {
          connect: {
            id: space.createdBy
          }
        },
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

const spaceDomain = 'colorful-lavender-turtle';

generateRubricProposals({ amount: 3, spaceIdOrDomain: spaceDomain, complete: true }).then(console.log);

// prisma.proposal.updateMany({
//   where: {
//     space: {
//       domain: spaceDomain
//     }
//   },
//   data: {
//     selectedCredentialTemplates: ["aabfa1de-df4d-4c3a-9799-251f4343f708"]
//   }
// }).then(console.log)
