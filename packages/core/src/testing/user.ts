import type { SpaceSubscriptionTier, SubscriptionTier, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

export async function generateSpaceUser({
  spaceId,
  isAdmin,
  isGuest,
  wallet
}: {
  spaceId: string;
  isAdmin?: boolean;
  isGuest?: boolean;
  wallet?: string;
}): Promise<User> {
  return prisma.user.create({
    data: {
      path: uuid(),
      identityType: 'Discord',
      username: 'Username',
      wallets: wallet ? { create: { address: wallet } } : undefined,
      spaceRoles: {
        create: {
          space: {
            connect: {
              id: spaceId
            }
          },
          isAdmin,
          isGuest: !isAdmin && isGuest
        }
      }
    }
  });
}

export type IPropertyTemplate = {
  id: string;
  name: string;
  type: string;
  options?: {
    id: string;
    value: string;
    color?: string;
  }[];
  description?: string;
};

/**
 * By default, all spaces are created as paid spaces in the pro tier
 */
type CreateUserAndSpaceInput = {
  user?: Partial<User>;
  isAdmin?: boolean;
  isGuest?: boolean;
  onboarded?: boolean;
  spaceName?: string;
  domain?: string;
  publicBountyBoard?: boolean;
  publicProposals?: boolean;
  publicProposalTemplates?: boolean;
  spacePaidTier?: SubscriptionTier;
  subscriptionTier?: SpaceSubscriptionTier;
  customProposalProperties?: IPropertyTemplate[];
  wallet?: string;
};

export async function generateUserAndSpace({
  user,
  isAdmin,
  isGuest,
  onboarded = true,
  spaceName = 'Example Space',
  domain,
  publicBountyBoard = false,
  publicProposals = false,
  publicProposalTemplates = false,
  spacePaidTier = 'community',
  subscriptionTier = 'gold',
  customProposalProperties,
  wallet
}: CreateUserAndSpaceInput = {}) {
  const userId = uuid();
  const newUser = await prisma.user.create({
    data: {
      id: userId,
      identityType: 'Wallet',
      username: `Test user ${Math.random()}`,
      spaceRoles: {
        create: {
          isAdmin,
          isGuest: !isAdmin && isGuest,
          onboarded,
          space: {
            create: {
              author: {
                connect: {
                  id: userId
                }
              },
              paidTier: spacePaidTier,
              subscriptionTier,
              updatedBy: userId,
              name: spaceName,
              // Adding prefix avoids this being evaluated as uuid
              domain: domain ?? `domain-${uuid()}`,
              publicBountyBoard,
              publicProposals,
              publicProposalTemplates
            }
          }
        }
      },
      path: uuid(),
      wallets: wallet
        ? {
            create: {
              address: wallet
            }
          }
        : undefined,
      ...user
    },
    include: {
      spaceRoles: {
        include: {
          space: true
        }
      }
    }
  });

  const { spaceRoles, ...userResult } = newUser;

  const space = spaceRoles[0].space;

  if (customProposalProperties?.length) {
    await prisma.proposalBlock.create({
      data: {
        type: 'board',
        spaceId: space.id,
        createdBy: newUser.id,
        updatedBy: newUser.id,
        id: uuid(),
        parentId: space.id,
        rootId: space.id,
        schema: 1,
        title: 'Content',
        fields: {
          cardProperties: customProposalProperties
        } as any
      }
    });
  }

  return {
    user: userResult,
    space
  };
}
export function generateUser(): Promise<User> {
  return prisma.user.create({
    data: {
      path: uuid(),
      username: `Test user ${Math.random()}`,
      identityType: 'RandomName'
    }
  });
}
