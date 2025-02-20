/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CredentialTemplate, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsCredentials, testUtilsUser } from '@charmverse/core/test';
import type {
  CreateCredentialTemplateInput,
  CredentialTemplateUpdateableFields
} from '@packages/credentials/templates';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import request from 'supertest';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser } from 'testing/setupDatabase';

let nonAdminUser: User;
let nonAdminUserCookie: string;
let adminUser: LoggedInUser;
let adminUserCookie: string;
let space: Space;

let input: CreateCredentialTemplateInput;

beforeAll(async () => {
  ({ space, user: nonAdminUser } = await testUtilsUser.generateUserAndSpace());

  adminUser = await generateSpaceUser({
    isAdmin: true,
    spaceId: space.id
  });

  nonAdminUserCookie = await loginUser(nonAdminUser.id);
  adminUserCookie = await loginUser(adminUser.id);

  input = {
    credentialEvents: ['proposal_approved'],
    description: 'Example credential',
    name: 'Example credential',
    organization: 'Example organization',
    schemaAddress: '0x1234',
    schemaType: 'proposal',
    spaceId: space.id
  };
});

describe('POST /api/credentials/templates - Create a credential template', () => {
  it('should allow a space admin to create credential templates, responding with 201', async () => {
    const createdTemplate = (
      await request(baseUrl).post(`/api/credentials/templates`).set('Cookie', adminUserCookie).send(input).expect(201)
    ).body as CredentialTemplate;

    expect(createdTemplate).toMatchObject(input);
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    await request(baseUrl).post(`/api/credentials/templates`).set('Cookie', nonAdminUserCookie).send(input).expect(401);
  });
});

describe('PUT /api/credentials/templates - Create a credential template', () => {
  let createdTemplate: CredentialTemplate;

  const update: CredentialTemplateUpdateableFields = {
    name: 'New name',
    description: 'New description',
    organization: 'New organization',
    credentialEvents: ['proposal_approved']
  };

  beforeAll(async () => {
    createdTemplate = await testUtilsCredentials.generateCredentialTemplate({ spaceId: space.id });
  });
  it('should allow a space admin to update a credential template, responding with 200', async () => {
    await request(baseUrl)
      .put(`/api/credentials/templates?templateId=${createdTemplate.id}`)
      .set('Cookie', adminUserCookie)
      .send(update)
      .expect(200);

    const updated = await prisma.credentialTemplate.findUniqueOrThrow({
      where: {
        id: createdTemplate.id
      }
    });

    expect(updated).toMatchObject({
      ...createdTemplate,
      ...update
    });
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    await request(baseUrl)
      .put(`/api/credentials/templates?templateId=${createdTemplate.id}`)
      .set('Cookie', nonAdminUserCookie)
      .send(update)
      .expect(401);
  });
});

describe('DELETE /api/credentials/templates - Delete a credential template', () => {
  it('should allow a space admin to update a credential template, responding with 200', async () => {
    const template = await testUtilsCredentials.generateCredentialTemplate({ spaceId: space.id });
    await request(baseUrl)
      .delete(`/api/credentials/templates?templateId=${template.id}`)
      .set('Cookie', adminUserCookie)
      .expect(200);

    const templateAfterDelete = await prisma.credentialTemplate.findUnique({
      where: {
        id: template.id
      }
    });

    expect(templateAfterDelete).toBeNull();
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const template = await testUtilsCredentials.generateCredentialTemplate({ spaceId: space.id });
    await request(baseUrl)
      .delete(`/api/credentials/templates?templateId=${template.id}`)
      .set('Cookie', nonAdminUserCookie)
      .expect(401);
  });
});

describe('GET /api/credentials/templates - Get templates for a space', () => {
  let testSpace: Space;
  let otherSpace: Space;

  let spaceTemplate: CredentialTemplate;
  let spaceSecondTemplate: CredentialTemplate;

  let otherSpaceTemplate: CredentialTemplate;

  beforeAll(async () => {
    ({ space: testSpace } = await testUtilsUser.generateUserAndSpace());

    spaceTemplate = await testUtilsCredentials.generateCredentialTemplate({ spaceId: testSpace.id });

    spaceSecondTemplate = await testUtilsCredentials.generateCredentialTemplate({ spaceId: testSpace.id });

    ({ space: otherSpace } = await testUtilsUser.generateUserAndSpace());

    otherSpaceTemplate = await testUtilsCredentials.generateCredentialTemplate({ spaceId: otherSpace.id });
  });

  // Important for case when a proposal is public
  it('should return all templates for a space without requiring a connected user, responding with 200', async () => {
    const spaceCredentialTemplates = (
      await request(baseUrl).get(`/api/credentials/templates?spaceId=${testSpace.id}`).expect(200)
    ).body;

    expect(spaceCredentialTemplates).toMatchObject(
      expect.arrayContaining([
        { ...spaceTemplate, createdAt: expect.any(String) },
        { ...spaceSecondTemplate, createdAt: expect.any(String) }
      ])
    );
  });

  it('should throw an error if no spaceId is provided, responding with 400', async () => {
    await request(baseUrl).get(`/api/credentials/templates`).expect(400);
  });
});
