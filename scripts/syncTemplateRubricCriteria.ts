import { Page, Proposal, ProposalReviewer, Vote, VoteStatus } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';
import { getVote } from 'lib/votes/getVote';
import { ExtendedVote } from 'lib/votes/interfaces';
import { v4 as uuid } from 'uuid';

// const templateId = '95eb2403-43b6-422f-ab27-598377a586c6';
// const copyToTemplates = ['5edd8765-7cae-4fd1-9d53-63f681c36e88'];

const templateIds = [
  'ebc5e81a-b682-483d-8fa3-74989f04f6b2',
  '645984b0-da09-435f-8953-a93dd88bf487',
  '6d0e893a-8f9b-4c94-ac87-9a5fe43e918f',

  // # Duplicate 2
  'b9e6ec85-5b1d-4a6f-9096-943e9ef13a0d',
  '9892440d-833c-45fc-87b7-38e61202c834',
  '62ae2210-4535-4ab3-82d0-cd1df9e5f30f',

  // # Duplicate 3
  '08e13ad7-277e-4d27-ae4f-e59121ab7890',
  '87d6a94d-c520-4b6e-9cd3-6f32d30c1e79',

  // // # Duplicate 4
  '474a77ec-7501-4038-8bc0-011ace40eab1',
  'da21dd46-8fc3-48df-896c-5ecf092b8418',

  // // # Duplicate 5
  '6959e446-1ecc-4a28-8554-a15c89e2c9c2',
  '2ee526f2-20a1-4cfc-9fcb-12035ab45f40',
  '8e6f7229-cc0b-4d87-ac02-cf181ca03588',
  'b3c8eb84-e98a-4f8d-b13d-bc397ad7e258',
  '647a63e4-7acc-45a4-a7bd-b972f3501d6a'
];

// // # Duplicate 5
// const templateId = '6959e446-1ecc-4a28-8554-a15c89e2c9c2';
// const copyToTemplates = [
//   '2ee526f2-20a1-4cfc-9fcb-12035ab45f40',
//   '8e6f7229-cc0b-4d87-ac02-cf181ca03588',
//   'b3c8eb84-e98a-4f8d-b13d-bc397ad7e258',
//   '647a63e4-7acc-45a4-a7bd-b972f3501d6a'
// ];

export async function updateProposalSteps() {
  for (let templateId of templateIds) {
    const pages = await prisma.page.findMany({
      where: {
        sourceTemplateId: templateId
      },
      include: {
        proposal: {
          include: {
            evaluations: true,
            rubricAnswers: true,
            draftRubricAnswers: true
          }
        }
      }
    });
    if (pages.length === 0) {
      console.log('No pages found for template:', templateId);
      continue;
    } else {
      console.log('Pages found for template:', templateId, pages.length, pages[0].id);
    }
    const withAnswers = pages.filter((p) => p.proposal!.rubricAnswers.length > 0);
    if (withAnswers.length === 0) {
      console.error(withAnswers.length + ' Answers found for template:', templateId);
      continue;
    }
    const withDraftAnswers = pages.filter((p) => p.proposal!.draftRubricAnswers.length > 0);
    if (withDraftAnswers.length > 0) {
      console.error(withDraftAnswers.length + ' Draft answers found for template:', templateId);
      continue;
    }
    console.log('Process template', templateId);

    const templateSource = await prisma.page.findFirstOrThrow({
      where: {
        id: templateId
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
    const rubricSteps = templateSource.proposal!.evaluations.filter((e) => e.type === 'rubric');
    if (rubricSteps.length !== 1) {
      throw new DataNotFoundError('Rubric steps not found. Counted: ' + rubricSteps.length);
    }
    const rubricStepSource = rubricSteps[0];
    for (let templateTarget of pages) {
      const rubricSteps = templateTarget.proposal!.evaluations.filter((e) => e.type === 'rubric');
      if (rubricSteps.length !== 1) {
        throw new DataNotFoundError('Rubric steps not found. Counted: ' + rubricSteps.length);
      }
      const rubricStepTarget = rubricSteps[0];
      await prisma.$transaction([
        prisma.proposalRubricCriteria.deleteMany({
          where: {
            evaluationId: rubricStepTarget.id
          }
        }),
        prisma.proposalRubricCriteria.createMany({
          data: rubricStepSource.rubricCriteria.map((c) => ({
            ...c,
            id: uuid(),
            evaluationId: rubricStepTarget.id,
            proposalId: templateTarget.proposal!.id,
            parameters: c.parameters as any
          }))
        })
      ]);
      console.log('Updated:', templateTarget.title, templateTarget.id);
    }
  }
}

updateProposalSteps().catch(console.error);
