import { ReactElement, useEffect } from 'react';
import { PageLayout } from 'components/common/page-layout';
import { setTitle } from 'components/common/page-layout/PageTitle';
import { useSpace } from 'hooks/useSpace';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';

export default function IndexPage () {
  const [space] = useSpace();
  const [pages] = usePages();
  const router = useRouter();
  setTitle(space.name);

  useEffect(() => {
    if (pages.length) {
      router.push(`/${space.domain}/${pages[0].path}`);
    }
  }, []);

  return null;
}

IndexPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};

// TODO: use this to redirect to the first page, once we have accurate data on the server side
// import { GetServerSideProps } from 'next';
// import { pages, spaces } from 'seedData';
//
// export const getServerSideProps: GetServerSideProps = async (context) => {
//   const domain = context.query.domain;
//   const space = spaces.find(space => space.domain === domain);
//   if (!space) {
//     console.error('No space found by domain: ' + domain);
//     return {
//       notFound: true
//     };
//   }
//   const firstPage = pages.filter(page => page.spaceId === space.id)[0];
//   if (!firstPage) {
//     console.error('Space has no pages: ' + space.id);
//     return {
//       notFound: true
//     };
//   }
//   return {
//     redirect: {
//       destination: `/${domain}/${firstPage.path}`,
//       permanent: false
//     }
//   };
// };
//
// export default function IndexPage () {
//   return <></>;
// }
