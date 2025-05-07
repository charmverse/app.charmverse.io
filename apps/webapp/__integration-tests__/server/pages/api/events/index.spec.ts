/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import type { PageEventMap } from '@packages/metrics/mixpanel/interfaces/PageEvent';
import type { EventInput } from '@packages/metrics/recordDatabaseEvent';
import { loginAnonymousUser } from '@packages/testing/mockApiCall';
import { baseUrl } from '@packages/config/constants';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

describe('POST /api/events - Analytics endpoint', () => {
  it('should create a user space action', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();
    const event: EventInput<PageEventMap['page_view']> = {
      event: 'page_view',
      type: 'settings/my-account',
      userId: uuid(),
      spaceId: space.id
    };

    const sessionCookie = await loginAnonymousUser(uuid());

    await request(baseUrl).post('/api/events').set('Cookie', sessionCookie).send(event).expect(200);

    const dbAction = await prisma.userSpaceAction.findFirst({
      where: { spaceId: space.id }
    });
    expect(dbAction).not.toBeNull();
  });

  it('should create a user space action for anonymous user', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();
    const event = {
      event: 'app_loaded',
      spaceId: space.id
    };

    const anonymousId = uuid();
    const sessionCookie = await loginAnonymousUser(anonymousId);

    await request(baseUrl).post('/api/events').set('Cookie', sessionCookie).send(event).expect(200);

    const dbAction = await prisma.userSpaceAction.findFirst({
      where: { distinctUserId: anonymousId }
    });
    expect(dbAction).not.toBeNull();
  });
});
