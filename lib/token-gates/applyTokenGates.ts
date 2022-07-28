import { DataNotFoundError, InsecureOperationError, InvalidInputError } from 'lib/utilities/errors';
import { verifyJwt, LitNodeClient } from 'lit-js-sdk';
import { prisma } from 'db';
import { Role } from '@prisma/client';
import { v4 } from 'uuid';
import { TokenGateVerification, TokenGateVerificationResult, TokenGateJwt, LitJwtPayload } from './interfaces';

export async function applyTokenGates ({ spaceId, userId, tokens }: TokenGateVerification): Promise<TokenGateVerificationResult> {

  if (!spaceId || !userId) {
    throw new InvalidInputError(`Please provide a valid ${!spaceId ? 'space' : 'user'} id.`);
  }

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    include: {
      roles: true
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Could not find space with id ${spaceId}`);
  }

  const tokenGateVerifications: TokenGateJwt[] = (await Promise.all(tokens.map(async tk => {
    const result = await verifyJwt({ jwt: tk.signedToken }) as {payload: LitJwtPayload, verified: boolean};
    // Perform additional checks here as per https://github.com/LIT-Protocol/lit-minimal-jwt-example/blob/main/server.js
    if (result?.verified && result.payload?.orgId === space.id) {
      const embeddedTokenGateId = JSON.parse(result.payload.extraData).tokenGateId;

      if (embeddedTokenGateId === tk.tokenGate.id) {
        return tk;
      }
    }

    return null;
  }))).filter(tk => tk !== null) as TokenGateJwt[];

  if (tokenGateVerifications.length === 0) {
    throw new InsecureOperationError('At least one token gate verification must succeed to grant a space membership.');
  }

  const tokenGates = await prisma.tokenGate.findMany({
    where: {
      spaceId,
      OR: tokenGateVerifications.map(tk => {
        return {
          id: tk.tokenGate.id
        };
      })
    },
    select: {
      id: true,
      tokenGateToRoles: true
    }
  });

  // We need to have at least one token gate that succeeded in order to proceed
  if (tokenGates.length === 0) {
    throw new DataNotFoundError('No token gates were found.');
  }

  const roleIdsToAssign: string[] = tokenGates.reduce((roleList, tokenGate) => {

    tokenGate.tokenGateToRoles.forEach(roleMapping => {
      if (!roleList.includes(roleMapping.roleId) && space.roles.some(role => role.id === roleMapping.roleId)) {
        roleList.push(roleMapping.roleId);
      }
    });

    return roleList;
  }, [] as string[]);

  const assignedRoles = roleIdsToAssign.map(roleId => space.roles.find(role => role.id === roleId) as Role);

  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  const returnValue: TokenGateVerificationResult = {
    userId,
    space,
    roles: assignedRoles
  };

  if (spaceMembership && roleIdsToAssign.length === 0) {
    return returnValue;
  }
  else if (spaceMembership) {
    await prisma.$transaction(roleIdsToAssign.map(roleId => {
      return prisma.spaceRoleToRole.upsert({
        where: {
          spaceRoleId_roleId: {
            spaceRoleId: spaceMembership.id,
            roleId
          }
        },
        create: {
          role: {
            connect: {
              id: roleId
            }
          },
          spaceRole: {
            connect: {
              id: spaceMembership.id
            }
          }
        },
        // Perform an empty update
        update: {}
      });
    }));

    return returnValue;
  }
  else {
    const spaceRoleId = v4();
    await prisma.$transaction([
      prisma.spaceRole.create({
        data: {
          id: spaceRoleId,
          spaceRoleToRole: {
            createMany: {
              data: roleIdsToAssign.map(roleId => {
                return {
                  roleId
                };
              }) }
          },
          isAdmin: false,
          space: {
            connect: {
              id: spaceId
            }
          },
          user: {
            connect: {
              id: userId
            }
          }
        }
      })
    ]);
    return returnValue;
  }

}
