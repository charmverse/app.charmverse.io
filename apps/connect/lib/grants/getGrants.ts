import { from } from '@apollo/client';
import { UndesirableOperationError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { type BoardFields } from '@root/lib/databases/board';
import { type CardFields } from '@root/lib/databases/card';

const grantsDatabaseBoardId = '4155ac5b-325a-4d9a-89ff-72ef1235aa85';

type DateValue = {
  from: number;
  to?: number;
};

export type Grant = {
  id: string;
  description: string;
  name: string;
  banner?: string;
  logo?: string;
  launchDate: DateValue | null;
  createdAt: string;
  applyLink?: string;
  path: string;
  status?: string;
  announcement: string;
  publishDate: DateValue;
};

function getParsedDateValue(dateStr: string | undefined): DateValue | null {
  const date = dateStr ? new Date(JSON.parse(dateStr).from) : null;
  return date ? { from: date.getTime(), to: date.getTime() } : null;
}

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
  const announcementProperty = boardProperties.find(
    (property) => property.type === 'text' && property.name === 'Announcement'
  );
  const statusProperty = boardProperties.find((property) => property.type === 'select' && property.name === 'Status');
  const publishDateProperty = boardProperties.find(
    (property) => property.type === 'date' && property.name === 'Publish date'
  );
  const statusRecord = (statusProperty?.options ?? []).reduce(
    (record, option) => ({
      ...record,
      [option.id]: option.value
    }),
    {} as Record<string, string>
  );

  if (
    !statusProperty ||
    !applyLinkProperty ||
    !descriptionProperty ||
    !bannerProperty ||
    !logoProperty ||
    !launchDateProperty ||
    !announcementProperty ||
    !publishDateProperty
  ) {
    throw new UndesirableOperationError();
  }

  return grantsCards
    .filter((card) => {
      const cardProperties = (card.fields as CardFields).properties;
      const publishDatePropertyValue = cardProperties[publishDateProperty.id] as string | undefined;
      const publishDate = getParsedDateValue(publishDatePropertyValue);
      return publishDate && publishDate.from <= new Date().getTime();
    })
    .map((card) => {
      const cardProperties = (card.fields as CardFields).properties;
      return {
        id: card.id,
        name: card.page?.title ?? 'Untitled',
        description: cardProperties[descriptionProperty.id] as string,
        banner: cardProperties[bannerProperty.id] as string,
        logo: cardProperties[logoProperty.id] as string,
        launchDate: getParsedDateValue(cardProperties[launchDateProperty.id] as string),
        createdAt: card.createdAt.toISOString(),
        path: card.page?.path ?? '',
        applyLink: cardProperties[applyLinkProperty.id] as string,
        status: statusRecord[cardProperties[statusProperty.id] as string],
        announcement: cardProperties[announcementProperty.id] as string,
        publishDate: getParsedDateValue(cardProperties[publishDateProperty.id] as string)
      } as Grant;
    })
    .sort((g1, g2) => {
      if (sort === 'new') {
        return g2.publishDate.from - g1.publishDate.from;
      } else {
        if (!g1.launchDate || !g2.launchDate) {
          return 0;
        }

        return g1.launchDate.from - g2.launchDate.from;
      }
    });
}
