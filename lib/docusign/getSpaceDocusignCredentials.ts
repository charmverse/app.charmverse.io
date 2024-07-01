import { InvalidInputError } from '@charmverse/core/errors';
import type { DocusignCredential, OptionalPrismaTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

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
