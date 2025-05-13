import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { recordDatabaseEvent } from '@packages/metrics/recordDatabaseEvent';

import { getRecentHistory } from '../getRecentHistory';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

afterEach(async () => {
  await prisma.page.deleteMany({
    where: {
      spaceId: space.id
    }
  });
});

function trackPageView(pageId: string) {
  return recordDatabaseEvent({
    event: {
      event: 'page_view',
      pageId,
      spaceId: space.id,
      userId: user.id
    },
    distinctUserId: user.id,
    userId: user.id
  });
}

describe('getRecentHistory', () => {
  it('should return a page visited', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });
    // generate another page that was not visited
    await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });
    await trackPageView(page.id);

    const history = await getRecentHistory({ spaceId: space.id, userId: user.id });

    expect(history.map((p) => p.id)).toEqual([page.id]);
  });

  it('should return the last viewed page first', async () => {
    const firstSeen = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });
    // generate another page that was not visited
    const lastSeen = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });
    await trackPageView(firstSeen.id);
    await trackPageView(lastSeen.id);

    const history = await getRecentHistory({ spaceId: space.id, userId: user.id });

    expect(history.map((p) => p.id)).toEqual([lastSeen.id, firstSeen.id]);
  });
});
