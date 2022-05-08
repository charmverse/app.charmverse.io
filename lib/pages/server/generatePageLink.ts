import { prisma } from 'db';
import { PageLink } from '../interfaces';
import { PageNotFoundError } from './errors';

export async function generatePageLink (pageId: string): Promise<PageLink> {
  const pageWithSpace = await prisma.page.findUnique({
    where: {
      id: pageId
    },
    include: {
      space: true
    }
  });

  if (!pageWithSpace) {
    throw new PageNotFoundError(pageId);
  }

  const domain = process.env.DOMAIN;

  const pageUrl = `${domain}/${pageWithSpace.space?.domain}/${pageWithSpace.path}`;

  return {
    title: pageWithSpace.title,
    url: pageUrl
  };
}
