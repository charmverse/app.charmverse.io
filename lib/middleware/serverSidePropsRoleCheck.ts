import { GetServerSidePropsContext, Redirect } from 'next';
import { prisma } from 'db';
import { User, Space } from '@prisma/client';

export interface IUserCannotAccessSpace {
  redirect?: Redirect
  notFound?: true
}

/**
 * Ensures that a valid space is being accessed and that a user exists
 * @param context
 * @returns
 */
export async function checkUserCanVisitWorkspace (
  context: GetServerSidePropsContext
): Promise<IUserCannotAccessSpace> {

  const domain = context.query.domain as string;
  const space = await prisma.space.findUnique({ where: { domain } });

  if (!space) {
    console.error(`No space found by domain: ${domain}`);
    return {
      notFound: true
    };
  }

  // Handle user access
  const userId = context.req.session.user?.id;

  // No user available in this session. Redirect to home page
  if (!userId) {
    return {
      redirect: {
        destination: '/login',
        permanent: false
      }
    };
  }

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    }
  });

  const userHasSpaceRole = spaceRoles.some(role => {
    return role.spaceId === space.id;
  });

  console.log('Has space role', userHasSpaceRole);

  if (!userHasSpaceRole) {

    const redirectSpace = await prisma.space.findUnique({
      where: {
        id: spaceRoles[0].spaceId
      }
    });

    return {
      redirect: {
        destination: `/${redirectSpace!.domain}`,
        permanent: false
      }
    };
  }

  return {};
}
