import { InsecureOperationError, InvalidInputError } from '@charmverse/core/errors';
import type { User, Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsMembers, testUtilsRandom } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { getAllowedDocusignRolesAndUsers, updateAllowedDocusignRolesAndUsers } from '../allowedDocusignRolesAndUsers';

describe('Docusign Roles and Users', () => {
  let space: Space;
  let admin: User;
  let user: User;

  beforeAll(async () => {
    ({ user: admin, space } = await testUtilsUser.generateUserAndSpace());
    user = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
  });

  describe('getAllowedDocusignRolesAndUsers', () => {
    it('should return allowed roles and users for a valid spaceId', async () => {
      const allowedRole = await testUtilsMembers.generateRole({
        createdBy: admin.id,
        spaceId: space.id
      });

      await prisma.docusignAllowedRoleOrUser.createMany({
        data: [
          { spaceId: space.id, roleId: allowedRole.id },
          { spaceId: space.id, userId: user.id }
        ]
      });

      const result = await getAllowedDocusignRolesAndUsers({ spaceId: space.id });
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ roleId: allowedRole.id }),
          expect.objectContaining({ userId: user.id })
        ])
      );
    });

    it('should return an empty array if no allowed roles or users found', async () => {
      const { space: spaceWithoutRoles } = await testUtilsUser.generateUserAndSpace();

      const result = await getAllowedDocusignRolesAndUsers({ spaceId: spaceWithoutRoles.id });
      expect(result).toEqual([]);
    });

    it('should throw InvalidInputError for invalid spaceId', async () => {
      await expect(getAllowedDocusignRolesAndUsers({ spaceId: 'invalid-uuid' })).rejects.toThrow(InvalidInputError);
    });
  });

  describe('updateAllowedDocusignRolesAndUsers', () => {
    it('should update and return allowed roles and users for valid input', async () => {
      const role = await testUtilsMembers.generateRole({
        createdBy: admin.id,
        spaceId: space.id
      });

      const allowedRolesAndUsers = [{ userId: user.id }, { roleId: role.id }];

      const result = await updateAllowedDocusignRolesAndUsers({ spaceId: space.id, allowedRolesAndUsers });

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userId: user.id }),
          expect.objectContaining({ roleId: role.id })
        ])
      );
    });

    it('should update and return allowed users if only users are provided', async () => {
      const allowedRolesAndUsers = [{ userId: user.id }];

      const result = await updateAllowedDocusignRolesAndUsers({ spaceId: space.id, allowedRolesAndUsers });

      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ userId: user.id })]));
    });

    it('should update and return allowed roles if only roles are provided', async () => {
      const role = await testUtilsMembers.generateRole({
        createdBy: admin.id,
        spaceId: space.id
      });

      const allowedRolesAndUsers = [{ roleId: role.id }];

      const result = await updateAllowedDocusignRolesAndUsers({ spaceId: space.id, allowedRolesAndUsers });

      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ roleId: role.id })]));
    });

    it('should throw InvalidInputError for invalid spaceId', async () => {
      const allowedRolesAndUsers = [{ userId: uuid() }];

      await expect(
        updateAllowedDocusignRolesAndUsers({ spaceId: 'invalid-uuid', allowedRolesAndUsers })
      ).rejects.toThrow(InvalidInputError);
    });

    it('should throw InsecureOperationError if user is not a space member', async () => {
      const nonSpaceUser = await testUtilsUser.generateUser();
      const allowedRolesAndUsers = [{ userId: nonSpaceUser.id }];

      await expect(updateAllowedDocusignRolesAndUsers({ spaceId: space.id, allowedRolesAndUsers })).rejects.toThrow(
        InsecureOperationError
      );
    });

    it('should throw InsecureOperationError if role is not in space', async () => {
      const { space: otherSpace, user: otherSpaceUser } = await testUtilsUser.generateUserAndSpace();

      const role = await testUtilsMembers.generateRole({
        createdBy: otherSpaceUser.id,
        spaceId: otherSpace.id
      });

      const allowedRolesAndUsers = [{ roleId: role.id }];

      await expect(updateAllowedDocusignRolesAndUsers({ spaceId: space.id, allowedRolesAndUsers })).rejects.toThrow(
        InsecureOperationError
      );
    });
  });
});
