import { InvalidInputError } from "@charmverse/core/errors";
import { Page, prisma } from "@charmverse/core/prisma-client";
import { RewardCreationData, createReward } from "lib/rewards/createReward";
import { RewardWithUsers } from "lib/rewards/interfaces";
import { work } from "lib/rewards/work";
import { isAddress } from "viem";
import { sepolia } from "viem/chains";



async function seedReward({spaceDomain, applicantAddresses, rewardData, createdBy, applicationsPerApplicant = 1}: {spaceDomain: string, applicantAddresses: string [], rewardData: Omit<RewardCreationData, 'spaceId' | 'userId'>, createdBy?: string, applicationsPerApplicant: number}): Promise<{reward: RewardWithUsers, page: Page}> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: spaceDomain
    }
  });
  
  const {reward} = await createReward({
    ...rewardData,
    spaceId: space.id,
    userId: createdBy ?? space.createdBy,
  })

  for (const address of applicantAddresses) {

    if (!isAddress(address)) {
      throw new InvalidInputError(`Valid EVM address required`);
    }

    const applicant = await prisma.user.findFirstOrThrow({
      where: {
        spaceRoles: {
          some: {
            spaceId: space.id
          }
        },
        wallets: {
          some: {
            address: address.toLowerCase()
          }
        }
      }
    })

    for (let i = 0; i < applicationsPerApplicant; i++) {
      await work({
        rewardId: reward.id,
        userId: applicant.id,
        walletAddress: address
      })
    }
  }

  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: reward.id
    }
  });

  return {
    page,
    reward
  }
}


const spaceDomain = 'icy-crimson-barracuda'

// seedReward({
//   spaceDomain,
//   applicationsPerApplicant: 5,
//   rewardData: {
//     pageProps: {
//       title: 'Demo 2'
//     },
//     maxSubmissions: 100,
//     chainId: sepolia.id,
//     rewardToken: 'ETH',
//     rewardAmount: 0.0001,
//     allowMultipleApplications: true
//   },
//   applicantAddresses: []
// }).then(data => {
//   console.log(`Find reward at ${process.env.DOMAIN}/${spaceDomain}/${data.page.path}`)
// })

// Utility to update all applications in the page to complete so we can mark them as paid
// prisma.application.updateMany({
//   where: {
//     bounty: {
//       page: {
//         path: 'page-7005800419474704'
//       }
//     }
//   },
//   data: {
//     status: 'complete'
//   }
// }).then(console.log)