import { prisma } from '@charmverse/core/prisma-client';
import { createDraftProposal } from 'lib/proposals/createDraftProposal';

/**
 * Use this script to perform database searches.
 */

async function search() {
  console.log(
    await prisma.page.delete({
      where: {
        id: '40650b3e-f365-4ad6-9003-5f5e614b8044'
      }
    })
  );
  console.log(
    await prisma.proposal.delete({
      where: {
        id: '40650b3e-f365-4ad6-9003-5f5e614b8044'
      }
    })
  );
  // const proposal = await prisma.proposal.findFirstOrThrow({
  //   where: {
  //     page: {
  //       id: '50799f98-571c-413b-8cec-e36cbf5ca572'
  //     }
  //   },
  //   include: {
  //     form: {
  //       include: {
  //         formFields: true
  //       }
  //     }
  //   }
  // });

  // console.log(proposal.form?.formFields || []);
  // const { page } = await createDraftProposal({
  //   createdBy: 'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835',
  //   spaceId: 'f3ddde2e-17e9-42b1-803d-0c72880e4669',
  //   contentType: 'free_form',
  //   pageType: 'proposal_template'
  // });
  // await prisma.page.update({
  //   where: {
  //     id: page.id
  //   },
  //   data: {
  //     createdAt: '2024-05-29T20:32:49.069Z',
  //     createdBy: 'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835',
  //     updatedAt: '2024-06-04T20:49:20.807Z',
  //     updatedBy: 'd5b4e5db-868d-47b0-bc78-ebe9b5b2c835',
  //     title: 'Retro Funding 4 Review',
  //     path: 'retro-funding-4-review-9411434043106064',
  //     spaceId: 'f3ddde2e-17e9-42b1-803d-0c72880e4669'
  //   }
  // });
  // await prisma.proposal.update({
  //   where: {
  //     id: page.id
  //   },
  //   data: {
  //     formId: '1e777ef4-06d8-49f8-9986-321f6b29cd0a',
  //     workflowId: 'f70825f7-d24d-4657-9222-9ac3952de7a0',
  //     fields: { properties: {}, enableRewards: true, pendingRewards: [] },
  //     status: 'published'
  //   }
  // });
  // console.log('template id', page.id);
}

search().then(() => console.log('Done'));
