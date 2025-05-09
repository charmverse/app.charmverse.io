import type { Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateBountyWithSingleApplication } from '@packages/testing/setupDatabase';
import request from 'supertest';

import type { ApplicationMeta, Reward } from '@packages/lib/rewards/interfaces';

describe('PUT /api/reward-applications/comments/:commentId - update application comment', () => {
  let space: Space;
  let user: User;
  let userCookie: string;
  let reward: Reward & { applications: ApplicationMeta[] };
  let application: ApplicationMeta;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;
    user = generated.user;
    userCookie = await loginUser(user.id);

    reward = await generateBountyWithSingleApplication({
      applicationStatus: 'inProgress',
      bountyCap: 20,
      spaceId: space.id,
      userId: user.id
    });

    application = reward.applications[0];
  });

  it('should return updated comment with a status code 200 if user has permission', async () => {
    const comment = await prisma.applicationComment.create({
      data: {
        content: '',
        contentText: '',
        applicationId: application.id,
        createdBy: user.id
      }
    });

    const updatedContent = {
      contentText: 'Updated comment text',
      content: {
        /* ... some updated content ... */
      }
    };

    const response = await request(baseUrl)
      .put(`/api/reward-applications/comments/${comment.id}`)
      .set('Cookie', userCookie)
      .send(updatedContent)
      .expect(200);

    expect(response.body).toMatchObject(updatedContent);
  });

  it('should fail if a user tries to update the comment they did not write, and return a status code 401', async () => {
    const otherUser = await testUtilsUser.generateUser();
    const otherUserCookie = await loginUser(otherUser.id);
    const comment = await prisma.applicationComment.create({
      data: {
        content: '',
        contentText: '',
        applicationId: application.id,
        createdBy: user.id
      }
    });

    const updatedContent = {
      contentText: 'Updated comment text',
      content: {
        /* ... some updated content ... */
      }
    };

    await request(baseUrl)
      .put(`/api/reward-applications/comments/${comment.id}`)
      .set('Cookie', otherUserCookie)
      .send(updatedContent)
      .expect(401);
  });
});

// describe('DELETE /api/reward-applications/comments/:commentId - delete application comment', () => {
//   let space: Space;
//   let admin: User;
//   let adminCookie: string;
//   let user: User;
//   let userCookie: string;
//   let reward: Reward & { applications: ApplicationMeta[] };
//   let application: ApplicationMeta;

//   beforeAll(async () => {
//     const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
//     space = generated.space;
//     admin = generated.user;
//     adminCookie = await loginUser(admin.id);
//     user = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
//     userCookie = await loginUser(user.id);

//     reward = await generateBountyWithSingleApplication({
//       applicationStatus: 'inProgress',
//       bountyCap: 20,
//       spaceId: space.id,
//       userId: user.id
//     });

//     application = reward.applications[0];
//   });

//   it('should return soft deleted comment with a status code 200 if user has permission', async () => {
//     const comment = await prisma.applicationComment.create({
//       data: {
//         content: '',
//         contentText: '',
//         applicationId: application.id,
//         createdBy: user.id
//       }
//     });

//     const response = await request(baseUrl)
//       .delete(`/api/reward-applications/comments/${comment.id}`)
//       .set('Cookie', userCookie)
//       .expect(200);

//     expect(response.body.deletedAt).toBeDefined();
//     expect(response.body.deletedBy).toBe(user.id);
//   });

//   it('should return soft deleted comment with a status code 200 if user is an admin of the space', async () => {
//     const comment = await prisma.applicationComment.create({
//       data: {
//         content: '',
//         contentText: '',
//         applicationId: application.id,
//         createdBy: user.id
//       }
//     });

//     const response = await request(baseUrl)
//       .delete(`/api/reward-applications/comments/${comment.id}`)
//       .set('Cookie', adminCookie)
//       .expect(200);

//     expect(response.body.deletedAt).toBeDefined();
//     expect(response.body.deletedBy).toBe(admin.id);
//   });

//   it('should return a status code 401 if user has no permission to delete the comment', async () => {
//     const otherUser = await testUtilsUser.generateUser();
//     const otherUserCookie = await loginUser(otherUser.id);
//     const comment = await prisma.applicationComment.create({
//       data: {
//         content: '',
//         contentText: '',
//         applicationId: application.id,
//         createdBy: user.id
//       }
//     });
//     await request(baseUrl)
//       .delete(`/api/reward-applications/comments/${comment.id}`)
//       .set('Cookie', otherUserCookie)
//       .expect(401);
//   });
// });
