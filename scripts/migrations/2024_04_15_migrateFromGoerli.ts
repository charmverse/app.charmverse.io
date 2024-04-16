import { arrayUtils } from "@charmverse/core/utilities";
import { PaymentMethod, prisma } from "@charmverse/core/prisma-client";
import { baseUrl } from "config/constants";
import { lowerCaseEqual, prettyPrint } from "lib/utils/strings";
import { goerli } from "viem/chains";
import { UnsignedTransaction } from "@lens-protocol/domain/entities";


async function migratePaymentMethods() {

  const usdcGoerliContract = '0x07865c6e87b9f70255377e024ace6630c1eaa37f';

  const usdcSepoliaContract = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
  // const count = await prisma.paymentMethod.count({
  //   where: {
  //     chainId: goerli.id
  //   }
  // });

  // const usdcCount = await prisma.paymentMethod.count({
  //   where: {
  //     chainId: goerli.id,
  //     contractAddress: '0x07865c6e87b9f70255377e024ace6630c1eaa37f'
  //   }
  // });

    // console.log({
  //   count,
  //   usdcCount
  // })

  const paymentMethodsRequiringResolution = await prisma.paymentMethod.findMany({
    where: {
      chainId: goerli.id,
      contractAddress: {
        not: usdcGoerliContract
      }
    },
    select: {
      id: true,
      contractAddress: true,
      tokenName: true,
      tokenSymbol: true,
    }
  });

  const rewards = await prisma.bounty.findMany({
    where: {
      rewardToken: {
        in: paymentMethodsRequiringResolution.map(pm => pm.contractAddress).filter(Boolean) as string[]
      },
      applications: {
        some: {
          status: {
            in: ['complete', 'paid', 'processing']
          }
        }
      }
    },
    select: {
      rewardToken: true,
      chainId: true,
      id: true,
      page: {
        select: {
          path: true,
          title: true
        }
      },
      space: {
        select: {
          domain: true
        }
      }
    },
    orderBy: {
      spaceId: 'asc'
    }
  })

  const uniqueSpaces = [] as string[];

  const rewardsByPaymentMethod = paymentMethodsRequiringResolution.reduce((acc, method) => {
    const relevantRewards = rewards.filter(reward =>  !!reward.rewardToken && lowerCaseEqual(reward.rewardToken, method.contractAddress));

    for (const reward of relevantRewards) {
      if (!uniqueSpaces.includes(reward.space.domain)) {
        uniqueSpaces.push(reward.space.domain)
      }
    }

    if (relevantRewards.length > 0) {
        relevantRewards.sort((a, b) => b.id.localeCompare(a.id)); // Sort by id in descending order
        acc.used.push({
            ...method,
            rewards: relevantRewards.map(reward => ({
              ...reward,
              fullPath: `${baseUrl}/${reward.space.domain}/${reward.page?.path}`
            }))
        });
    } else {
        acc.unused.push(method);
    }
    return acc;
}, { used: [] as (Pick<PaymentMethod, 'contractAddress'> & {rewards: any})[], unused: [] as any });


  const uniqueUsedTokens = arrayUtils.uniqueValues(rewardsByPaymentMethod.used.map(pm => pm.contractAddress?.toLowerCase()))


  // console.log('\r\n---------------\r\n')
  prettyPrint({
    rewardsByPaymentMethod,
    uniqueUsedTokens,
    uniqueSpaces
  });

 

  prettyPrint({
    uniqueUsedTokens
  });

}

migratePaymentMethods().then(() => console.log('Done'));


// https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields#filtering-on-object-key-value-inside-array

// lib/tokenGates/validateTokenGateCondition.ts

// async function migrateTokenGates() {
//   const tokenGates = await prisma.tokenGate.findMany({
//     where: {
//       conditions: {
//         path: ['accessControlConditions']
//         accessControlConditions: {
//           some: {
//             operator: 'OR'
//           }
//         }
//       }
//     }
//   })
// }