/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Prisma, Space } from '@charmverse/core/dist/prisma';
import request from 'supertest';
import { v4 } from 'uuid';

import { emptyDocument } from 'lib/prosemirror/constants';
import { DataNotFoundError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import {
  generateApplicationComment,
  generateBounty,
  generateBountyApplication,
  generateBountyWithSingleApplication,
  generateSpaceUser,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  nonAdminUserSpace = generated.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);
});

describe('GET /api/applications/[id]/comments - retrieve all comments for an application', () => {
  it('Should fail if no application with passed applicationId was found', async () => {
    try {
      await request(baseUrl).get(`/api/applications/${v4()}/comments`).set('Cookie', nonAdminCookie).expect(404);
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the user is not a member of the space, and respond 401', async () => {
    const { user: userFromOtherSpace } = await generateUserAndSpaceWithApiToken();
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 1,
      userId: nonAdminUser.id,
      bountyStatus: 'open',
      spaceId: nonAdminUserSpace.id
    });

    const otherSpaceUserCookie = await loginUser(userFromOtherSpace.id);

    await request(baseUrl)
      .get(`/api/applications/${bounty.applications[0].id}/comments`)
      .set('Cookie', otherSpaceUserCookie)
      .expect(401);
  });

  it('should fail if the user is not the applicant, and respond 401', async () => {
    const { user: applicantUser, space } = await generateUserAndSpaceWithApiToken(undefined, false);
    const nonApplicantUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 1,
      userId: applicantUser.id,
      bountyStatus: 'open',
      spaceId: space.id
    });
    const applicationId = bounty.applications[0].id;
    const nonApplicantUserCookie = await loginUser(nonApplicantUser.id);

    await request(baseUrl)
      .get(`/api/applications/${applicationId}/comments`)
      .set('Cookie', nonApplicantUserCookie)
      .expect(401);
  });

  it('should retrieve application comments for the applicant, and respond 200', async () => {
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 1,
      userId: nonAdminUser.id,
      bountyStatus: 'open',
      spaceId: nonAdminUserSpace.id
    });

    const applicationId = bounty.applications[0].id;

    await generateApplicationComment({
      userId: nonAdminUser.id,
      bountyId: bounty.page.id,
      applicationId
    });

    const applicationPageComments = (
      await request(baseUrl)
        .get(`/api/applications/${applicationId}/comments`)
        .set('Cookie', nonAdminCookie)
        .expect(200)
    ).body;

    expect(applicationPageComments.length).toBe(1);
  });

  it('should retrieve application comments for the reviewer, and respond 200', async () => {
    const reviewerUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: nonAdminUserSpace.id
    });

    const reviewerUserCookie = await loginUser(reviewerUser.id);

    const bounty = await generateBounty({
      spaceId: nonAdminUserSpace.id,
      createdBy: nonAdminUser.id,
      status: 'inProgress',
      approveSubmitters: false,
      title: 'My new bounty2',
      bountyPermissions: {
        reviewer: [
          {
            group: 'user',
            id: reviewerUser.id
          }
        ]
      }
    });

    const application = await generateBountyApplication({
      applicationStatus: 'applied',
      bountyId: bounty.id,
      spaceId: nonAdminUserSpace.id,
      userId: nonAdminUser.id,
      walletAddress: nonAdminUser.wallets[0]?.address
    });

    const applicationId = application.id;

    await generateApplicationComment({
      userId: nonAdminUser.id,
      bountyId: bounty.page.id,
      applicationId
    });

    const applicationPageComments = (
      await request(baseUrl)
        .get(`/api/applications/${applicationId}/comments`)
        .set('Cookie', reviewerUserCookie)
        .expect(200)
    ).body;

    expect(applicationPageComments.length).toBe(1);
  });
});

describe('POST /api/applications/[id]/comments - create application comment', () => {
  it('Should fail if no application with passed applicationId was found', async () => {
    try {
      await request(baseUrl).post(`/api/applications/${v4()}/comments`).set('Cookie', nonAdminCookie).expect(404);
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the user is not a member of the space, and respond 401', async () => {
    const { user: userFromOtherSpace } = await generateUserAndSpaceWithApiToken();
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 1,
      userId: nonAdminUser.id,
      bountyStatus: 'open',
      spaceId: nonAdminUserSpace.id
    });

    const otherSpaceUserCookie = await loginUser(userFromOtherSpace.id);

    await request(baseUrl)
      .post(`/api/applications/${bounty.applications[0].id}/comments`)
      .set('Cookie', otherSpaceUserCookie)
      .expect(401);
  });

  it('should fail if the user is not the applicant, and respond 401', async () => {
    const { user: applicantUser, space } = await generateUserAndSpaceWithApiToken(undefined, false);
    const nonApplicantUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });

    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 1,
      userId: applicantUser.id,
      bountyStatus: 'open',
      spaceId: space.id
    });

    const nonApplicantUserCookie = await loginUser(nonApplicantUser.id);

    await request(baseUrl)
      .post(`/api/applications/${bounty.applications[0].id}/comments`)
      .set('Cookie', nonApplicantUserCookie)
      .expect(401);
  });

  it('should create comment for applicant', async () => {
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 1,
      userId: nonAdminUser.id,
      bountyStatus: 'open',
      spaceId: nonAdminUserSpace.id
    });

    const applicationId = bounty.applications[0].id;

    await generateApplicationComment({
      userId: nonAdminUser.id,
      bountyId: bounty.page.id,
      applicationId
    });

    const applicationPageComment = (
      await request(baseUrl)
        .post(`/api/applications/${applicationId}/comments`)
        .send({
          contentText: '',
          content: emptyDocument
        })
        .set('Cookie', nonAdminCookie)
        .expect(201)
    ).body;

    expect(applicationPageComment.parentId).toBe(applicationId);
  });

  it('should create comment for reviewer', async () => {
    const bounty = await generateBountyWithSingleApplication({
      applicationStatus: 'applied',
      bountyCap: 1,
      userId: nonAdminUser.id,
      bountyStatus: 'open',
      spaceId: nonAdminUserSpace.id
    });

    const applicationId = bounty.applications[0].id;

    await generateApplicationComment({
      userId: nonAdminUser.id,
      bountyId: bounty.page.id,
      applicationId
    });

    const applicationPageComment = (
      await request(baseUrl)
        .post(`/api/applications/${applicationId}/comments`)
        .send({
          contentText: '',
          content: emptyDocument
        })
        .set('Cookie', nonAdminCookie)
        .expect(201)
    ).body;

    expect(applicationPageComment.parentId).toBe(applicationId);
  });
});
