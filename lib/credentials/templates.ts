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
      organization: fields.organization
    }
  });
}

export type CreateCredentialTemplateInput = Pick<
  CredentialTemplate,
  'name' | 'description' | 'organization' | 'spaceId' | 'schemaType' | 'schemaAddress'
>;

export async function createCredentialTemplate({
  description,
  name,
  organization,
  schemaAddress,
  schemaType,
  spaceId
}: CreateCredentialTemplateInput): Promise<CredentialTemplate> {
  return prisma.credentialTemplate.create({
    data: {
      name,
      description,
      organization,
      schemaAddress,
      schemaType,
      space: { connect: { id: spaceId } }
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
