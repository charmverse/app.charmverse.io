import { withSessionSsr } from 'lib/session/withSession';
import { prisma } from 'db';

export const getServerSideProps = withSessionSsr(
  async ({ req }) => {
    const { user } = req.session;
    if (!user) {
      console.log('Send user to login');
      return {
        redirect: {
          destination: '/login',
          permanent: false
        }
      };
    }
    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        userId: user.id
      }
    });

    const space = spaceRoles.length ? await prisma.space.findFirst({
      where: {
        id: spaceRoles[0].spaceId
      }
    }) : null;

    if (space) {

      return {
        redirect: {
          destination: `/${space.domain}`,
          permanent: false
        }
      };
    }
    else {
      console.log('Send user to create workspace');
      return {
        redirect: {
          destination: '/createWorkspace',
          permanent: false
        }
      };
    }
  }
);

// Next.js requires a default export
export default function Stub () {
  return null;
}
