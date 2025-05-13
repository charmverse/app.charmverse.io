import { stringUtils } from '@charmverse/core/utilities';
import { InvalidInputError } from '@charmverse/core/errors';
import { ApplicationStatus, Page, prisma } from '@charmverse/core/prisma-client';
import { RewardCreationData, createReward } from 'lib/rewards/createReward';
import { RewardWithUsers } from 'lib/rewards/interfaces';
import { work } from 'lib/rewards/work';
import { getSpace } from 'lib/spaces/getSpace';
import { isAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { generateBountyWithSingleApplication } from '@packages/testing/setupDatabase';

async function seedReward({
  spaceDomain,
  applicantAddresses,
  rewardData,
  createdBy,
  applicationsPerApplicant = 1
}: {
  spaceDomain: string;
  applicantAddresses: string[];
  rewardData: Omit<RewardCreationData, 'spaceId' | 'userId'>;
  createdBy?: string;
  applicationsPerApplicant: number;
}): Promise<{ reward: RewardWithUsers; page: Page }> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      domain: spaceDomain
    }
  });

  const { reward } = await createReward({
    ...rewardData,
    spaceId: space.id,
    userId: createdBy ?? space.createdBy
  });

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
    });

    for (let i = 0; i < applicationsPerApplicant; i++) {
      await work({
        rewardId: reward.id,
        userId: applicant.id,
        walletAddress: address
      });
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
  };
}

async function seedMultipleRewardsWithUserApplication({
  spaceIdOrDomain,
  userWalletOrId,
  applicationStatus,
  amount = 10,
  selectedCredentialTemplates
}: {
  userWalletOrId: string;
  spaceIdOrDomain: string;
  applicationStatus: ApplicationStatus;
  amount?: number;
  selectedCredentialTemplates?: string[];
}) {
  const space = await getSpace(spaceIdOrDomain);

  const user = await prisma.user.findFirstOrThrow({
    where: stringUtils.isUUID(userWalletOrId)
      ? {
          id: userWalletOrId
        }
      : {
          wallets: {
            some: {
              OR: [
                {
                  ensname: userWalletOrId
                },
                {
                  address: userWalletOrId.toLowerCase()
                }
              ]
            }
          }
        }
  });

  for (let i = 0; i < amount; i++) {
    await generateBountyWithSingleApplication({
      applicationStatus,
      bountyCap: 20,
      spaceId: space.id,
      userId: user.id,
      selectedCredentialTemplateIds: selectedCredentialTemplates
    });
  }

  console.log('Generated', amount, 'rewards with an application for user', user.username);
}

const spaceDomain = 'icy-crimson-barracuda';

seedMultipleRewardsWithUserApplication({
  spaceIdOrDomain: 'low-scarlet-catshark',
  userWalletOrId: 'melboudi.eth',
  applicationStatus: 'inProgress',
  selectedCredentialTemplates: ['4f77738e-3c85-4bcc-b3e9-487fdf8edf5d']
}).then(console.log);

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
