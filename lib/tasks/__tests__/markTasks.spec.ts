import type { User, UserNotification } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { markTasks } from '../markTasks';

let user: User;
let userNotification: UserNotification;
beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  userNotification = await prisma.userNotification.create({
    data: {
      taskId: v4(),
      type: 'mention',
      userId: user.id
    }
  });
});

describe('markTasks', () => {
  it('Should create notification for a task if its not present', async () => {
    const taskId = v4();
    await markTasks([
      {
        id: taskId,
        type: 'mention'
      }
    ], user.id);

    const userNotifications = await prisma.userNotification.findMany({
      where: {
        userId: user.id
      },
      select: {
        taskId: true
      }
    });

    const userNotificationTaskIds = userNotifications.map(_userNotification => _userNotification.taskId);
    expect(userNotificationTaskIds).toStrictEqual([userNotification.taskId, taskId]);
  });
});
