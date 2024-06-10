import { prisma } from '@charmverse/core/prisma-client';
import { createDraftProposal } from 'lib/proposals/createDraftProposal';

/**
 * Use this script to perform database searches.
 */

const spaceId = 'f3ddde2e-17e9-42b1-803d-0c72880e4669';

async function search() {
  // console.log(
  //   await prisma.page.delete({
  //     where: {
  //       id: 'a18016bd-a6e8-4b78-9e3f-c64aafa4d3b7'
  //     }
  //   })
  // );
  // console.log(
  //   await prisma.proposal.delete({
  //     where: {
  //       id: 'a18016bd-a6e8-4b78-9e3f-c64aafa4d3b7'
  //     }
  //   })
  // );
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: 'a8ac2799-5c79-45f7-9527-a1d52d717625'
    },
    include: {
      form: {
        include: {
          formFields: true
        }
      }
    }
  });
  console.log(proposal.form.formFields);
  // console.log(
  //   await prisma.page.deleteMany({
  //     where: {
  //       id: {
  //         in: proposal.map((p) => p.id)
  //       }
  //     }
  //   })
  // );
  // console.log(
  //   await prisma.proposal.deleteMany({
  //     where: {
  //       id: {
  //         in: proposal.map((p) => p.id)
  //       }
  //     }
  //   })
  // );
  // console.log(proposal.map((p) => p.title + ' ' + p.proposal?.status));
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
