import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { generatePageQuery } from 'lib/pages/server/generatePageQuery';

import { DatabasePageNotFoundError, SpaceNotFoundError } from './errors';
import type { DatabasePage } from './interfaces';

/**
 * @databaseId can be the database ID or page path
 */
type SchemaRequest = {
  spaceId?: string;
  databaseId: string;
};

export async function getDatabaseWithSchema({ databaseId, spaceId }: SchemaRequest): Promise<DatabasePage> {
  // eslint-disable-next-line prefer-const
  const databasePage = await prisma.page.findFirst({
    where: generatePageQuery({ pageIdOrPath: databaseId, spaceIdOrDomain: spaceId }),
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      type: true,
      title: true,
      spaceId: true,
      path: true
    }
  });

  if (!databasePage) {
    throw new DatabasePageNotFoundError(databaseId);
  }

  const space = await prisma.space.findUnique({
    where: {
      id: databasePage.spaceId
    },
    select: {
      domain: true
    }
  });

  if (!space) {
    throw new SpaceNotFoundError(`Space not found: ${spaceId}`);
  }

  const databaseBlock = await prisma.block.findFirst({
    where: {
      type: 'board',
      id: databasePage.id
    }
  });

  if (!databaseBlock) {
    throw new DatabasePageNotFoundError(databaseId);
  }

  const { path, ...pageProperties } = databasePage;

  const appDomain = process.env.DOMAIN;

  return {
    ...pageProperties,
    schema: (databaseBlock as any).fields.cardProperties,
    url: `${appDomain}/${space.domain}/${path}`
  } as DatabasePage;
}
