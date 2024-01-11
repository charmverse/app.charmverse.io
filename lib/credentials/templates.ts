import type { CredentialTemplate, IssueCredentialEvent, Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { InvalidInputError } from 'lib/utilities/errors';

import { defaultCredentialChain, getEasConnector } from './connectors';

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

type CredentialTemplateUpdateableFields = Partial<Pick<CredentialTemplate, 'name' | 'description' | 'organization'>>;

export async function updateCredentialTemplate({
  templateId,
  fields
}: {
  templateId: string;
  fields: CredentialTemplateUpdateableFields;
}): Promise<CredentialTemplate> {
  return prisma.credentialTemplate.update({
    where: {
      id: templateId
    },
    data: {
      name: fields.name,
      description: fields.description,
      organization: fields.organization
    }
  });
}

export type SpaceCredentialEventUpdate = {
  spaceId: string;
  credentialEvents: IssueCredentialEvent[];
};

export async function updateSpaceCredentialEvents({
  spaceId,
  credentialEvents
}: SpaceCredentialEventUpdate): Promise<Space> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid spaceId: ${spaceId}`);
  }

  return prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      credentialEvents
    }
  });
}
