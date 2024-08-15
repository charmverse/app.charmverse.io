import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { StatusAPIResponse } from '@farcaster/auth-client';
import { render } from '@react-email/render';
import * as mailer from '@root/lib/mailer';
import { isTruthy } from '@root/lib/utils/types';

import { ProjectConfirmation } from './templates/ProjectConfirmation';

export async function sendProjectConfirmationEmail({ userId, projectId }: { userId: string; projectId: string }) {
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
      projectMembers: {
        select: {
          name: true,
          user: {
            select: {
              farcasterUser: {
                select: {
                  fid: true,
                  account: true
                }
              }
            }
          }
        }
      }
    }
  });

  const html = render(
    ProjectConfirmation({
      project: {
        ...project,
        projectMemberUsernames: project.projectMembers
          .map((member) => (member.user?.farcasterUser?.account as unknown as StatusAPIResponse)?.username)
          .filter(isTruthy)
      }
    })
  );

  await mailer.sendEmail({
    to: {
      displayName: project.projectMembers[0].name,
      email: user.email!,
      userId
    },
    senderAddress: `The Sunnys <updates@mail.thesunnyawards.fun>`,
    subject: 'Congratulations you just entered the Sunnys',
    html
  });
}

// sendProjectConfirmationEmail({
//   projectId: '0d0f84fa-d207-4885-bba2-2b94791f0208',
//   userId: '968cc3fb-ffe4-493b-b45b-8316865c49b0'
// });
