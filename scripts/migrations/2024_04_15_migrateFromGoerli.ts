import { arrayUtils } from '@charmverse/core/utilities';
import { PaymentMethod, TokenGate, prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from 'config/constants';
import { lowerCaseEqual, prettyPrint } from '@packages/utils/strings';
import { goerli, sepolia } from 'viem/chains';
import { UnsignedTransaction } from '@lens-protocol/domain/entities';

async function migratePaymentMethods() {
  const usdcGoerliContract = '0x07865c6e87b9f70255377e024ace6630c1eaa37f';

  const usdcSepoliaContract = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

  await prisma.paymentMethod.updateMany({
    where: {
      contractAddress: usdcGoerliContract,
      chainId: goerli.id
    },
    data: {
      contractAddress: usdcSepoliaContract,
      chainId: sepolia.id
    }
  });

  await prisma.paymentMethod.deleteMany({
    where: {
      chainId: goerli.id
    }
  });
}

async function clearGoerliTokenGates() {
  const tokenGates = (await prisma.$queryRaw`SELECT id, conditions, "spaceId" FROM "TokenGate"
  WHERE conditions::jsonb @>
      '{
          "accessControlConditions": [
              {
                  "chain": 5
              }
          ]
      }'`) as TokenGate[];

  await prisma.tokenGate.deleteMany({
    where: {
      id: {
        in: tokenGates.map((tg) => tg.id)
      }
    }
  });
}

async function clearOldRewardsToken() {
  await prisma.bounty.updateMany({
    where: {
      chainId: goerli.id
    },
    data: {
      chainId: null,
      rewardToken: null,
      rewardAmount: null,
      customReward: null
    }
  });
}

async function migrateFromGoerli() {
  await migratePaymentMethods();
  await clearOldRewardsToken();
  await clearGoerliTokenGates();
}

migrateFromGoerli().then(() => null);

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
