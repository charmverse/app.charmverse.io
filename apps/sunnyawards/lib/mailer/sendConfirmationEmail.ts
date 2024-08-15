import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { render } from '@react-email/render';
import * as mailer from '@root/lib/mailer';

import { ProjectConfirmation } from './templates/ProjectConfirmation';

export async function sendConfirmationEmail({ userId, projectId }: { userId: string; projectId: string }) {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      email: true
    }
  });

  const email = user.email;

  if (!email) {
    log.info('User does not have an email address', { userId });
    return;
  }

  const project = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    include: {
      projectMembers: true
    }
  });

  const html = render(ProjectConfirmation({ project }));

  await mailer.sendEmail({
    to: {
      displayName: project.projectMembers[0].name,
      email: user.email!,
      userId
    },
    senderAddress: `The Sunnys <replies@${process.env.MAILGUN_DOMAIN as string}>`,
    subject: 'Congratulations you just entered the Sunnys',
    html
  });
}
