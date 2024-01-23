import type { CredentialTemplate, CredentialEventType, Space } from '@charmverse/core/prisma-client';
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

type CredentialTemplateUpdateableFields = Partial<
  Pick<CredentialTemplate, 'name' | 'description' | 'organization' | 'credentialEvents'>
>;

export type CredentialTemplateUpdate = {
  templateId: string;
  fields: CredentialTemplateUpdateableFields;
};

export async function updateCredentialTemplate({
  templateId,
  fields
}: CredentialTemplateUpdate): Promise<CredentialTemplate> {
  return prisma.credentialTemplate.update({
    where: {
      id: templateId
    },
    data: {
      name: fields.name,
      description: fields.description,
      organization: fields.organization,
      credentialEvents: fields.credentialEvents
    }
  });
}

export type CreateCredentialTemplateInput = Pick<
  CredentialTemplate,
  'name' | 'description' | 'organization' | 'spaceId' | 'schemaType' | 'schemaAddress' | 'credentialEvents'
>;

export async function createCredentialTemplate({
  description,
  name,
  organization,
  schemaAddress,
  schemaType,
  spaceId,
  credentialEvents
}: CreateCredentialTemplateInput): Promise<CredentialTemplate> {
  return prisma.credentialTemplate.create({
    data: {
      name,
      description,
      organization,
      schemaAddress,
      schemaType,
      credentialEvents,
      space: { connect: { id: spaceId } }
    }
  });
}
