import { DataNotFoundError, InsecureOperationError, InvalidInputError } from 'lib/utilities/errors';
import { verifyJwt } from 'lit-js-sdk';
import { prisma } from 'db';
import { Role } from '@prisma/client';
import { v4 } from 'uuid';
import { TokenGateVerification, TokenGateVerificationResult, TokenGateJwt } from './interfaces';

export async function applyTokenGates ({ spaceId, userId, tokens }: TokenGateVerification): Promise<TokenGateVerificationResult> {

  if (!spaceId || !userId) {
    throw new InvalidInputError(`Please provide a valid ${!spaceId ? 'space' : 'user'} id.`);
  }

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Could not find space with id ${spaceId}`);
  }

  const tokenGateVerifications: TokenGateJwt[] = (await Promise.all(tokens.map(tk => {
    return verifyJwt({ jwt: tk.signedToken })
      .then(result => {
        if (result.verified) {
          return tk;
        }
        else {
          return null;
        }
      })
      .catch(err => {
        return null;
      });
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

  if (tokenGates.length === 0) {
    throw new DataNotFoundError('No token gates were found.');
  }

  const roleIdsToAssign: string[] = tokenGates.reduce((roleList, tokenGate) => {

    tokenGate.tokenGateToRoles.forEach(roleMapping => {
      if (!roleList.includes(roleMapping.roleId)) {
        roleList.push(roleMapping.roleId);
      }
    });

    return roleList;
  }, [] as string[]);

  return {
    userId,
    space,
    roles: []
  };

  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId,
      userId
    }
  });

  /*
  const spaceRoleId = v4();

  if (!spaceMembership) {
    await prisma.$transaction([
      prisma.spaceRole.create({
        data: {
          id: spaceRoleId,
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
  }
  */

}
