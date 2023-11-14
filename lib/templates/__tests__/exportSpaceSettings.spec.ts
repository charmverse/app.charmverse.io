import type { MemberProperty, MemberPropertyPermission, Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers } from '@charmverse/core/test';

import { generateUserAndSpace } from 'testing/setupDatabase';

import type { SpaceSettingsExport } from '../exportSpaceSettings';
import { exportSpaceSettings } from '../exportSpaceSettings';

describe('exportSpaceSettings', () => {
  let user: User;
  let space: Space;
  let role: Role;
  let memberProperty: MemberProperty & { permissions: MemberPropertyPermission[] };

  beforeAll(async () => {
    ({ user, space } = await generateUserAndSpace({ isAdmin: true }));
    role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    space = await prisma.space.update({
      where: { id: space.id },
      data: {
        features: [
          {
            id: 'rewards',
            path: 'rewards',
            title: 'Jobs',
            isHidden: false
          },
          {
            id: 'member_directory',
            path: 'members',
            title: 'Membership Registry',
            isHidden: false
          },
          {
            id: 'proposals',
            path: 'proposals',
            title: 'Proposals',
            isHidden: true
          },
          {
            id: 'bounties',
            path: 'bounties',
            title: 'Bounties',
            isHidden: true
          },
          {
            id: 'forum',
            path: 'forum',
            title: 'Forum',
            isHidden: false
          }
        ],
        memberProfiles: [
          {
            id: 'charmverse',
            title: 'CharmVerse',
            isHidden: false
          },
          {
            id: 'collection',
            title: 'Collection',
            isHidden: true
          },
          {
            id: 'ens',
            title: 'ENS',
            isHidden: true
          },
          {
            id: 'lens',
            title: 'Lens',
            isHidden: false
          },
          {
            id: 'summon',
            title: 'Summon',
            isHidden: false
          }
        ]
      }
    });

    memberProperty = await prisma.memberProperty.create({
      data: {
        createdBy: user.id,
        name: 'Test Member Property',
        type: 'name',
        updatedBy: user.id,
        space: { connect: { id: space.id } },
        permissions: {
          create: {
            memberPropertyPermissionLevel: 'view',
            roleId: role.id
          }
        }
      },
      include: {
        permissions: true
      }
    });
  });

  it('should export space settings correctly', async () => {
    const exportedSettings = await exportSpaceSettings({ targetSpaceIdOrDomain: space.id });

    expect(exportedSettings).toMatchObject<SpaceSettingsExport>({
      space: {
        features: space.features,
        memberProfiles: space.memberProfiles,
        memberProperties: [
          {
            ...memberProperty,
            permissions: memberProperty.permissions
          }
        ]
      }
    });
  });

  it('should throw an error for invalid targetSpaceIdOrDomain', async () => {
    await expect(exportSpaceSettings({ targetSpaceIdOrDomain: 'invalid-id' })).rejects.toThrow();
    await expect(exportSpaceSettings({ targetSpaceIdOrDomain: undefined as any })).rejects.toThrow();
  });
});
