import { withSessionSsr } from 'lib/session/withSession';
import { prisma } from 'db';

export const getServerSideProps = withSessionSsr(
  async ({ req }) => {
    const { user } = req.session;
    if (!user) {
      return {
        redirect: {
          destination: '/login',
          permanent: false
        }
      };
    }
    const spaces = await prisma.space.findMany({
      where: {
        createdBy: user.id
      }
    });
    if (spaces.length) {
      return {
        redirect: {
          destination: spaces[0].domain,
          permanent: false
        }
      };
    }
    else {
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
