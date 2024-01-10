import type { CredentialTemplate } from '@charmverse/core/dist/cjs/prisma-client';
import { prisma } from '@charmverse/core/dist/cjs/prisma-client';
import { stringUtils } from '@charmverse/core/dist/cjs/utilities';

import { InvalidInputError } from 'lib/utilities/errors';

export async function getCredentialTemplates({ spaceId }: { spaceId: string }): Promise<CredentialTemplate[]> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid spaceId: ${spaceId}`);
  }

  const credentials = await prisma.credentialTemplate.findMany({
    where: {
      spaceId
    }
  });

  return credentials;
}
