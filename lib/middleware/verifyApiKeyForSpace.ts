import { prisma } from '@charmverse/core/prisma-client';

export async function verifyApiKeyForSpace({ apiKey, spaceId }: { apiKey: string; spaceId: string }) {
  if (!apiKey || !spaceId) {
    return false;
  }

  const spaceWitkTokens = await prisma.space.findFirst({
    where: { id: spaceId },
    include: { superApiToken: true, apiToken: true }
  });

  if (spaceWitkTokens) {
    // verify super api key
    if (spaceWitkTokens.superApiToken?.token === apiKey) {
      return true;
    }

    // verify regular api key
    if (spaceWitkTokens.apiToken?.token === apiKey) {
      return true;
    }
  }

  return false;
}
