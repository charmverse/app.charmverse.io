import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { isProdEnv } from '@root/config/constants';
import type { IPropertyTemplate, BoardFields } from '@root/lib/databases/board';
import { type CardFields } from '@root/lib/databases/card';

const grantsDatabaseBoardId = isProdEnv ? '4155ac5b-325a-4d9a-89ff-72ef1235aa85' : '';

type DateValue = {
  from: number;
  to?: number;
};

export type Grant = {
  id: string;
  description?: string;
  name: string;
  banner?: string;
  logo?: string;
  launchDate?: DateValue;
  createdAt: string;
  applyLink?: string;
  status?: string;
  announcement?: string;
  publishDate?: DateValue;
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
  if (!grantsDatabaseBoardId) {
    log.warn('Returning 0 grants because an id was not provided for the grants tracker database');
    return [];
  }
  const [grantsDatabase, grantsCards] = await Promise.all([
    prisma.block.findUnique({
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

  if (!grantsDatabase) {
    log.warn('Returning 0 grants because we could not find the grants tracker database', { grantsDatabaseBoardId });
    return [];
  }

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

  const propertiesRecord: Record<string, IPropertyTemplate | undefined> = {
    Status: statusProperty,
    'Apply link': applyLinkProperty,
    Description: descriptionProperty,
    Banner: bannerProperty,
    Logo: logoProperty,
    'Launch date': launchDateProperty,
    Announcement: announcementProperty,
    'Publish date': publishDateProperty
  };

  const nonExistentProperties = Object.entries(propertiesRecord).filter(([_, property]) => !property);

  if (nonExistentProperties.length) {
    log.warn(
      `The following properties are missing from the grants tracker database: ${nonExistentProperties
        .map(([name]) => name)
        .join(', ')}`
    );
  }

  return grantsCards
    .filter((card) => {
      const cardProperties = (card.fields as CardFields).properties;
      const publishDatePropertyValue = publishDateProperty
        ? (cardProperties[publishDateProperty.id] as string | undefined)
        : undefined;
      const publishDate = getParsedDateValue(publishDatePropertyValue);
      return publishDate && publishDate.from <= new Date().getTime();
    })
    .map((card) => {
      const cardProperties = (card.fields as CardFields).properties;
      return {
        id: card.id,
        name: card.page?.title ?? 'Untitled',
        description: descriptionProperty ? (cardProperties[descriptionProperty.id] as string) : undefined,
        banner: bannerProperty ? (cardProperties[bannerProperty.id] as string) : undefined,
        logo: logoProperty ? (cardProperties[logoProperty.id] as string) : undefined,
        launchDate: launchDateProperty
          ? getParsedDateValue(cardProperties[launchDateProperty.id] as string)
          : undefined,
        createdAt: card.createdAt.toISOString(),
        applyLink: applyLinkProperty ? (cardProperties[applyLinkProperty.id] as string) : undefined,
        status: statusProperty ? statusRecord[cardProperties[statusProperty.id] as string] : undefined,
        announcement: announcementProperty ? (cardProperties[announcementProperty.id] as string) : undefined,
        publishDate: publishDateProperty
          ? getParsedDateValue(cardProperties[publishDateProperty.id] as string)
          : undefined
      } as Grant;
    })
    .sort((g1, g2) => {
      if (sort === 'new') {
        return (g2.publishDate?.from ?? 0) - (g1.publishDate?.from ?? 0);
      } else {
        if (!g1.launchDate || !g2.launchDate) {
          return 0;
        }

        return g1.launchDate.from - g2.launchDate.from;
      }
    });
}
