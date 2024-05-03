import type { PersonaUserKyc, SynapsUserKyc } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

export async function generateSynapsCredential({ spaceId }: { spaceId: string }) {
  return prisma.synapsCredential.create({
    data: {
      apiKey: uuid(),
      spaceId
    }
  });
}

export async function generatePersonaCredential({ spaceId }: { spaceId: string }) {
  return prisma.personaCredential.create({
    data: {
      apiKey: uuid(),
      spaceId,
      templateId: uuid()
    }
  });
}

export async function generateSynapsUserKyc({
  spaceId,
  userId,
  status = 'APPROVED',
  sessionId = uuid()
}: Pick<SynapsUserKyc, 'userId' | 'spaceId'> & Partial<Pick<SynapsUserKyc, 'status' | 'sessionId'>>) {
  return prisma.synapsUserKyc.create({
    data: {
      status,
      sessionId,
      spaceId,
      userId
    }
  });
}

export async function generatePersonaUserKyc({
  spaceId,
  userId,
  status = 'approved',
  inquiryId = uuid()
}: Pick<PersonaUserKyc, 'userId' | 'spaceId'> & Partial<Pick<PersonaUserKyc, 'status' | 'inquiryId'>>) {
  return prisma.personaUserKyc.create({
    data: {
      inquiryId,
      spaceId,
      userId,
      status
    }
  });
}

export async function generateUserAndSpaceKyc({ spaceId, userId }: { spaceId: string; userId: string }) {
  const synapsCredentials = await generateSynapsCredential({ spaceId });
  const synapsUserKyc = await generateSynapsUserKyc({ spaceId, userId });
  await prisma.space.update({
    where: {
      id: spaceId
    },
    data: {
      kycOption: 'synaps'
    }
  });

  return { synapsCredentials, synapsUserKyc };
}
