import { GetServerSidePropsContext } from 'next';
import { prisma } from 'db';
import { InviteLink, Space } from '@prisma/client';

export interface InviteProps {
  invitation: InviteLink & {
    space: Space;
  };
}

export async function getServerSideProps (context: GetServerSidePropsContext) {

  const inviteCode = context.query.inviteCode as string;
  const invitation = await prisma.inviteLink.findUnique({
    where: {
      code: inviteCode
    },
    include: {
      space: true
    }
  });

  if (!invitation) {
    return {
      props: {
        error: 'Invitation not found'
      }
    };
  }

  return {
    props: {
      invitation
    }
  };
}

export async function createInviteLink ({ spaceId, userId }: { spaceId: string, userId: string }) {
  const link = await prisma.inviteLink.create({
    data: {
      createdBy: userId,
      spaceId
    }
  });
  return link;
}

export function acceptInviteLink () {

}

export async function deleteInviteLink (id: string) {
  await prisma.inviteLink.delete({
    where: {
      id
    }
  });
}

export function parseUrl (url: string): string | undefined {
  let inviteId: string | undefined;
  try {
    inviteId = new URL(url).pathname.split('/').pop();
  }
  catch (err) {
    //
  }
  return inviteId;
}
