import { UndesirableOperationError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { type BoardFields } from '@root/lib/databases/board';
import { type CardFields } from '@root/lib/databases/card';

const grantsDatabaseBoardId = '8cfb5664-b51b-41bd-afbd-44e284fa756d';

export type Grant = {
  id: string;
  description: string;
  name: string;
  banner?: string;
  logo?: string;
  launchDate?: { from: number; to: number };
  createdAt: string;
  applyLink?: string;
  path: string;
  open?: boolean;
};

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
    (property) => property.type === 'text' && property.name === 'Description'
  );
  const bannerProperty = boardProperties.find((property) => property.type === 'url' && property.name === 'Banner');
  const logoProperty = boardProperties.find((property) => property.type === 'url' && property.name === 'Logo');
  const launchDateProperty = boardProperties.find(
    (property) => property.type === 'date' && property.name === 'Launch date'
  );
  const applyLinkProperty = boardProperties.find(
    (property) => property.type === 'url' && property.name === 'Apply link'
  );
  const statusProperty = boardProperties.find((property) => property.type === 'select' && property.name === 'Status');
  const statusRecord = (statusProperty?.options ?? []).reduce((record, option) => {
    const isOpen = option.value === 'Open for applications';
    return {
      ...record,
      [option.id]: isOpen
    };
  }, {} as Record<string, boolean>);

  if (
    !statusProperty ||
    !applyLinkProperty ||
    !descriptionProperty ||
    !bannerProperty ||
    !logoProperty ||
    !launchDateProperty
  ) {
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
        launchDate: cardProperties[launchDateProperty.id] as unknown as { from: number; to: number },
        createdAt: card.createdAt.toISOString(),
        path: card.page?.path ?? '',
        applyLink: cardProperties[applyLinkProperty.id] as string,
        open: statusRecord[cardProperties[statusProperty.id] as string]
      } as Grant;
    })
    .sort((g1, g2) => {
      if (sort === 'new') {
        return g2.createdAt.localeCompare(g1.createdAt);
      } else {
        if (!g1.launchDate || !g2.launchDate) {
          return 0;
        }

        return g1.launchDate.from - g2.launchDate.from;
      }
    });
}
