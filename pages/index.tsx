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
    const spaces = await prisma.space.findMany({
      where: {
        createdBy: user.id
      }
    });
    if (spaces.length) {
      return {
        redirect: {
          destination: `/${spaces[0].domain}`,
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
