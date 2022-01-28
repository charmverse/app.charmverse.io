import { GetServerSideProps } from 'next';
import { pages, spaces } from 'seedData';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const domain = context.query.domain;
  const space = spaces.find(space => space.domain === domain);
  if (!space) {
    console.error('No space found by domain: ' + domain);
    return {
      notFound: true
    };
  }
  const firstPage = pages.filter(page => page.spaceId === space.id)[0];
  if (!firstPage) {
    console.error('Space has no pages: ' + space.id);
    return {
      notFound: true
    };
  }
  return {
    redirect: {
      destination: `/${domain}/${firstPage.path}`,
      permanent: false
    }
  };
};

export default function Index() {
  return <></>;
}