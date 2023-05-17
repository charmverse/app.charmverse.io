/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@charmverse/core/prisma-client';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import { baseUrl } from 'config/constants';
import type { PageEventMap } from 'lib/metrics/mixpanel/interfaces/PageEvent';
import type { EventInput } from 'pages/api/events/index';
import { loginAnonymousUser } from 'testing/mockApiCall';
import { createMockSpace } from 'testing/mocks/user';

describe('POST /api/events - Analytics endpoint', () => {
  it('should create a user space action', async () => {
    const space = await createMockSpace();
    const event: EventInput<PageEventMap['page_view']> = {
      event: 'page_view',
      type: 'settings',
      userId: uuid(),
      spaceId: space.id
    };

    const sessionCookie = await loginAnonymousUser('abc');

    await request(baseUrl).post('/api/events').set('Cookie', sessionCookie).send(event).expect(200);

    const dbAction = await prisma.userSpaceAction.findFirst({
      where: { spaceId: space.id }
    });
    expect(dbAction).toNotBeNull();
  });
});
