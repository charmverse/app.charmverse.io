import { Prisma, prisma } from '@charmverse/core/prisma-client';

async function addMissingRubricCriteria() {
  const title = 'Timely Submission';

  const evaluations = await prisma.proposalEvaluation.findMany({
    where: {
      type: 'rubric',
      rubricCriteria: {
        none: {
          title: {
            contains: title,
            mode: 'insensitive'
          }
        }
      },
      proposal: {
        space: {
          domain: 'op-grants'
        },
        archived: {
          not: true
        }
      }
    }
  });

  await prisma.proposalRubricCriteria.createMany({
    data: evaluations.map((evaluation) => ({
      evaluationId: evaluation.id,
      parameters: { max: 2, min: -2 },
      description:
        '-2. Proposal submitted in last 48 hours of Submission Period\n' +
        '0. Proposal submitted in second week of Submission Period\n' +
        '2. Proposal submitted in first week of Submission Period',
      type: 'range',
      index: 13,
      title,
      proposalId: evaluation.proposalId
    }))
  });
}

// addMissingRubricCriteria().then(console.log).catch(console.error);
