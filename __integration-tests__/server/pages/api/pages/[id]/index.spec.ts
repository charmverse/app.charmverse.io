/* eslint-disable @typescript-eslint/no-unused-vars */
import { Prisma, Space, User } from '@prisma/client';
import { IPageWithPermissions } from 'lib/pages';
import { addSpaceOperations } from 'lib/permissions/spaces';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateBounty, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { prisma } from 'db';

describe('GET /api/pages/{pageId} - get page', () => {

  it('should return a bounty page to a non workspace member if the page is a bounty accessible to the workspace, and the space has enabled the public bounty board', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), false);

    const bounty = await generateBounty({
      approveSubmitters: false,
      createdBy: user.id,
      spaceId: space.id,
      status: 'open',
      bountyPermissions: {
        submitter: [{
          group: 'space',
          id: space.id
        }]
      }
    });

    await prisma.space.update({
      where: {
        id: space.id
      },
      data: {
        publicBountyBoard: true
      }
    });

    const { body: createdPage } = await request(baseUrl)
      .get(`/api/pages/${bounty.page.id}`)
      .send()
      .expect(200) as {body: IPageWithPermissions};

    expect(createdPage.id).toBe(bounty.page.id);
  });

});
