import type { Role, Space, TokenGate, TokenGateToRole, User } from '@prisma/client';
import { SpaceRole } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { createUserFromWallet } from 'lib/users/createUser';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

// User 1 is admin
let user1: LoggedInUser;
let user2: LoggedInUser;
let space: Space;
let cookie1: string;
let cookie2: string;
let role1: Role;
let tokenGate: TokenGate;
let role2: Role;
let tokenGateToRole: TokenGateToRole;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());

  user1 = generated.user;
  user2 = await createUserFromWallet(v4());
  space = generated.space;
  await prisma.spaceRole.create({
    data: {
      space: {
        connect: {
          id: space.id
        }
      },
      user: {
        connect: {
          id: user2.id
        }
      }
    }
  });

  role1 = await prisma.role.create({
    data: {
      name: 'Role 1',
      space: {
        connect: {
          id: space.id
        }
      },
      createdBy: user1.id
    }
  });

  role2 = await prisma.role.create({
    data: {
      name: 'Role 2',
      space: {
        connect: {
          id: space.id
        }
      },
      createdBy: user1.id
    }
  });

  tokenGate = await prisma.tokenGate.create({
    data: {
      conditions: {},
      createdBy: user1.id,
      resourceId: {},
      space: {
        connect: {
          id: space.id
        }
      }
    }
  });

  // Attaching the role "Role 1" to the token gate
  tokenGateToRole = await prisma.tokenGateToRole.create({
    data: {
      tokenGate: {
        connect: {
          id: tokenGate.id
        }
      },
      role: {
        connect: {
          id: role1.id
        }
      }
    }
  });

  cookie1 = await loginUser(user1.id);
  cookie2 = await loginUser(user2.id);

});

describe('POST /token-gates/{tokenGateId}/rolesn- assign roles to token gate', () => {
  it('Should fail if correct keys are not provided in body', async () => {
    const response = await request(baseUrl).post(`/api/token-gates/${tokenGate.id}/roles`).set('Cookie', cookie1).send({});
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Key roleIds is required in request body and must not be an empty value');
  });

  it('Should fail if the user is not an admin of the space', async () => {
    const response = await request(baseUrl).post(`/api/token-gates/${tokenGate.id}/roles`).set('Cookie', cookie2).send({ spaceId: space.id, roleIds: [] });
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Only space administrators can perform this action');
  });

  it('Should create & delete new tokeGateToRole records', async () => {
    const response = await request(baseUrl).post(`/api/token-gates/${tokenGate.id}/roles`).set('Cookie', cookie1).send({ spaceId: space.id, roleIds: [role2.id] });
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject<TokenGateToRole[]>([{
      createdAt: expect.any(String),
      id: expect.any(String),
      roleId: role2.id,
      tokenGateId: tokenGate.id
    }]);
    // The previous token gate role record was deleted
    expect(await prisma.tokenGateToRole.findUnique({
      where: {
        id: tokenGateToRole.id
      }
    })).toBeNull();
  });
});

afterAll(async () => {
  // Deleting space will delete
  // Roles
  // Token Gates
  // Token Gate To Roles
  await prisma.space.delete({
    where: {
      id: space.id
    }
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: [user1.id, user2.id]
      }
    }
  });
});
