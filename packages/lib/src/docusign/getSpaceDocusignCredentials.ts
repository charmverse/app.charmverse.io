import type { DocusignCredential, OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

export async function getSpaceDocusignCredentials({
  spaceId,
  tx = prisma
}: { spaceId: string } & OptionalPrismaTransaction): Promise<DocusignCredential> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid spaceId: ${spaceId}`);
  }

  const credentials = await tx.docusignCredential.findFirstOrThrow({
    where: {
      spaceId
    }
  });

  return credentials;
}
