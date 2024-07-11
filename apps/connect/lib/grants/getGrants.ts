import { UndesirableOperationError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { Grant } from '@connect/components/grants/GrantsDetailsPage';

import type { BoardFields } from 'lib/databases/board';
import type { CardFields } from 'lib/databases/card';

const grantsDatabaseBoardId = '8cfb5664-b51b-41bd-afbd-44e284fa756d';

export async function getGrants(
  {
    sort
  }: {
    sort: 'new' | 'upcoming';
  } = {
    sort: 'new'
  }
): Promise<Grant[]> {
  const [grantsDatabase, grantsCards] = await Promise.all([
    prisma.block.findUniqueOrThrow({
      where: {
        id: grantsDatabaseBoardId
      },
      select: {
        fields: true
      }
    }),
    prisma.block.findMany({
      where: {
        parentId: grantsDatabaseBoardId,
        type: 'card'
      },
      select: {
        id: true,
        fields: true,
        createdAt: true,
        page: {
          select: {
            title: true,
            path: true
          }
        }
      }
    })
  ]);

  const boardProperties = (grantsDatabase.fields as unknown as BoardFields).cardProperties;

  const descriptionProperty = boardProperties.find(
    (property) => property.type === 'text' && property.name === 'Grants Description'
  );
  const bannerProperty = boardProperties.find(
    (property) => property.type === 'url' && property.name === 'Grants Banner'
  );
  const logoProperty = boardProperties.find((property) => property.type === 'url' && property.name === 'Grants Logo');
  const launchDateProperty = boardProperties.find(
    (property) => property.type === 'date' && property.name === 'Grants Launch Date'
  );
  const applyLinkProperty = boardProperties.find(
    (property) => property.type === 'url' && property.name === 'Grants Apply Link'
  );

  if (!applyLinkProperty || !descriptionProperty || !bannerProperty || !logoProperty || !launchDateProperty) {
    throw new UndesirableOperationError();
  }

  return grantsCards
    .map((card) => {
      const cardProperties = (card.fields as CardFields).properties;
      return {
        id: card.id,
        name: card.page?.title ?? 'Untitled',
        description: cardProperties[descriptionProperty.id] as string,
        banner: cardProperties[bannerProperty.id] as string,
        logo: cardProperties[logoProperty.id] as string,
        launchDate: cardProperties[launchDateProperty.id] as string,
        createdAt: card.createdAt.toISOString(),
        path: card.page?.path ?? '',
        applyLink: cardProperties[applyLinkProperty.id] as string
      };
    })
    .sort((g1, g2) => {
      if (sort === 'new') {
        return g2.createdAt.localeCompare(g1.createdAt);
      } else {
        return g1.launchDate.localeCompare(g2.launchDate);
      }
    });
}
