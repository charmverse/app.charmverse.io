import { InvalidInputError } from '@charmverse/core/errors';
import type { DocusignCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export async function getSpaceDocusignCredentials({ spaceId }: { spaceId: string }): Promise<DocusignCredential> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid spaceId: ${spaceId}`);
  }

  const credentials = await prisma.docusignCredential.findFirstOrThrow({
    where: {
      spaceId
    }
  });

  return credentials;
}
