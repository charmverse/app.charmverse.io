import { InvalidInputError } from "@charmverse/core/errors";
import { prisma } from "@charmverse/core/prisma-client";
import { testUtils, testUtilsProposals } from "@charmverse/core/test";
import { emptyDocument } from "lib/prosemirror/constants";




async function seedProposals({spaceDomain, count}: {spaceDomain: string, count: number}) {

  if (!spaceDomain) {
    throw new InvalidInputError(`spaceDomain is required`)
  }

  // await prisma.proposal.deleteMany({
  //   where: {
  //     space: {
  //       domain: spaceDomain
  //     }
  //   }
  // })
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: spaceDomain
    }
  });

  const category = await prisma.proposalCategory.findFirstOrThrow({
    where: {
      spaceId: space.id
    }
  })
  
  for (let i = 0; i <count; i++) {
    await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: space.createdBy,
      proposalStatus: 'discussion',
      content: {...emptyDocument},
      categoryId: category.id,
      title: `Proposal ${i + 1}`
    })

    console.log('Generated proposal', i +1, '/', count, 'in space', space.domain)
  }
}

seedProposals({count: 150, spaceDomain: 'blank-alpha-butterfly'}).then(() => console.log('Done'));


