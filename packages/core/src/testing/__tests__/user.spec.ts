import type { SpaceRole } from 'prisma-client';
import { prisma } from 'prisma-client';
import { v4 as uuid } from 'uuid';

import type { IPropertyTemplate } from '../user';
import { generateUserAndSpace } from '../user';

describe('generateUserAndSpace', () => {
  it('should create a pro tier space without public proposals or bounties, and a non admin user by default', async () => {
    const { space, user } = await generateUserAndSpace();

    expect(space.publicBountyBoard).toBe(false);
    expect(space.publicProposals).toBe(false);
    expect(space.paidTier).toBe('community');

    const spaceRole = (await prisma.spaceRole.findFirst({
      where: {
        spaceId: space.id,
        userId: user.id
      }
    })) as SpaceRole;

    expect(spaceRole.isAdmin).toBe(false);
  });

  it('should pass the given parameters to the space and user admin role', async () => {
    const randomDomain = `cvt-${Math.random()}`;
    const { space, user } = await generateUserAndSpace({
      publicBountyBoard: true,
      publicProposals: true,
      spacePaidTier: 'enterprise',
      isAdmin: true,
      domain: randomDomain,
      publicProposalTemplates: true
    });

    expect(space.publicBountyBoard).toBe(true);
    expect(space.publicProposals).toBe(true);
    expect(space.publicProposalTemplates).toBe(true);
    expect(space.paidTier).toBe('enterprise');
    expect(space.domain).toBe(randomDomain);

    const spaceRole = (await prisma.spaceRole.findFirst({
      where: {
        spaceId: space.id,
        userId: user.id
      }
    })) as SpaceRole;

    expect(spaceRole.isAdmin).toBe(true);
  });

  it('should initialise custom proposal schema if requested', async () => {
    const customProps: IPropertyTemplate[] = [
      {
        id: uuid(),
        name: 'Custom Prop',
        type: 'select',
        options: [
          { id: uuid(), value: 'Green' },
          { id: uuid(), value: 'Blue' }
        ]
      }
    ];

    const { space } = await generateUserAndSpace({
      customProposalProperties: customProps
    });

    const customPropsFromDB = await prisma.proposalBlock.findFirst({
      where: {
        type: 'board',
        spaceId: space.id
      }
    });

    expect(customPropsFromDB).toBeDefined();

    expect((customPropsFromDB?.fields as any).cardProperties).toEqual(customProps);
  });
});
