import type { MemberProperty, MemberPropertyPermission, Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';

import type { SpaceDataExport } from '../exportSpaceData';
import type { SpaceSettingsExport } from '../exportSpaceSettings';
import { importSpaceSettings } from '../importSpaceSettings';

describe('importSpaceSettings', () => {
  let user: User;
  let sourceSpace: Space;
  let role: Role;
  let memberProperty: MemberProperty & { permissions: MemberPropertyPermission[] };

  let dataToImport: Pick<SpaceDataExport, 'roles' | 'space'>;

  beforeAll(async () => {
    ({ user, space: sourceSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));
    role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: sourceSpace.id
    });

    sourceSpace = await prisma.space.update({
      where: { id: sourceSpace.id },
      data: {
        notificationToggles: { polls: false, proposals: false },
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
        space: { connect: { id: sourceSpace.id } },
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

    dataToImport = {
      roles: [role],
      space: {
        ...sourceSpace,
        memberProperties: [memberProperty]
      }
    };
  });

  it('should import space settings correctly', async () => {
    // Simulate export data
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();

    const updatedSpace = await importSpaceSettings({ targetSpaceIdOrDomain: targetSpace.id, exportData: dataToImport });

    const targetSpaceRoles = await prisma.role.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    expect(updatedSpace).toMatchObject(
      expect.objectContaining<SpaceSettingsExport>({
        notificationToggles: sourceSpace.notificationToggles,
        features: sourceSpace.features,
        memberProfiles: sourceSpace.memberProfiles,
        memberProperties: [
          {
            ...memberProperty,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            id: expect.any(String),
            createdBy: targetSpace.createdBy,
            updatedBy: targetSpace.createdBy,
            spaceId: targetSpace.id,
            permissions: [
              {
                id: expect.any(String),
                memberPropertyId: updatedSpace.memberProperties[0].id,
                roleId: targetSpaceRoles[0].id,
                memberPropertyPermissionLevel: 'view'
              }
            ]
          }
        ]
      })
    );
  });

  it('should throw an error for missing space in import data', async () => {
    await expect(importSpaceSettings({ targetSpaceIdOrDomain: null as any, exportData: {} })).rejects.toThrow();
  });
});
