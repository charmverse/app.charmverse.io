/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import { emptyDocument } from 'lib/prosemirror/constants';
import { DataNotFoundError } from 'lib/utilities/errors';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import {
  generateApplicationComment,
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

describe('PUT /api/applications/[id]/comments/[commentId] - update application comment', () => {
  it('Should fail if no application with passed applicationId was found, and respond 404', async () => {
    try {
      await request(baseUrl)
        .put(`/api/applications/${v4()}/comments/${v4()}`)
        .set('Cookie', nonAdminCookie)
        .expect(404);
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('Should fail if no comment with passed commentId was found, and respond 404', async () => {
    try {
      const bounty = await generateBountyWithSingleApplication({
        applicationStatus: 'applied',
        bountyCap: 1,
        userId: nonAdminUser.id,
        bountyStatus: 'open',
        spaceId: nonAdminUserSpace.id
      });

      const applicationId = bounty.applications[0].id;

      await request(baseUrl)
        .put(`/api/applications/${applicationId}/comments/${v4()}`)
        .set('Cookie', nonAdminCookie)
        .expect(404);
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
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
    const applicationId = bounty.applications[0].id;

    const applicationComment = await generateApplicationComment({
      userId: nonAdminUser.id,
      bountyId: bounty.page.id,
      applicationId
    });

    await request(baseUrl)
      .put(`/api/applications/${applicationId}/comments/${applicationComment.id}`)
      .set('Cookie', nonApplicantUserCookie)
      .expect(401);
  });

  it('should successfully edit application comments for applicants, and respond 200', async () => {
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

    const applicationComment = await generateApplicationComment({
      userId: nonAdminUser.id,
      bountyId: bounty.page.id,
      applicationId
    });

    const updatedApplicationComment = (
      await request(baseUrl)
        .put(`/api/applications/${applicationId}/comments/${applicationComment.id}`)
        .send({
          content: emptyDocument,
          contentText: 'Updated'
        })
        .set('Cookie', nonAdminCookie)
        .expect(200)
    ).body;

    expect(updatedApplicationComment.contentText).toBe('Updated');
  });
});

describe('DELETE /api/applications/[id]/comments/[commentId] - delete application comment', () => {
  it('Should fail if no application with passed applicationId was found, and respond 404', async () => {
    try {
      await request(baseUrl)
        .delete(`/api/applications/${v4()}/comments/${v4()}`)
        .set('Cookie', nonAdminCookie)
        .expect(404);
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('Should fail if no comment with passed commentId was found, and respond 404', async () => {
    try {
      const bounty = await generateBountyWithSingleApplication({
        applicationStatus: 'applied',
        bountyCap: 1,
        userId: nonAdminUser.id,
        bountyStatus: 'open',
        spaceId: nonAdminUserSpace.id
      });

      const applicationId = bounty.applications[0].id;

      await request(baseUrl)
        .delete(`/api/applications/${applicationId}/comments/${v4()}`)
        .set('Cookie', nonAdminCookie)
        .expect(404);
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
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
    const applicationId = bounty.applications[0].id;

    const applicationComment = await generateApplicationComment({
      userId: nonAdminUser.id,
      bountyId: bounty.page.id,
      applicationId
    });

    await request(baseUrl)
      .delete(`/api/applications/${applicationId}/comments/${applicationComment.id}`)
      .set('Cookie', nonApplicantUserCookie)
      .expect(401);
  });

  it('should successfully delete application comments for applicants, and respond 200', async () => {
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

    const applicationComment = await generateApplicationComment({
      userId: nonAdminUser.id,
      bountyId: bounty.page.id,
      applicationId
    });

    await request(baseUrl)
      .delete(`/api/applications/${applicationId}/comments/${applicationComment.id}`)
      .send({
        content: emptyDocument,
        contentText: 'Updated'
      })
      .set('Cookie', nonAdminCookie)
      .expect(200);
  });
});
