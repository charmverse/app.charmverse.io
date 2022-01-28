import { ReactElement } from 'react';
import { Editor } from 'components/editor';
import { PageLayout } from 'components/common/page-layout';
import { setTitle } from 'components/common/page-layout/PageTitle';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';

// export const getServerSideProps: GetServerSideProps = async (context) => {
//   return {
//     props: { domain: context.query.domain }
//   };
// };

export default function BlocksEditorPage () {

  const router = useRouter();
  setTitle('Welcome!');
  const { pagePath } = router.query;
  const [pages] = usePages();
  console.log('pages', pagePath);
  const pageByPath = pages.find(page => page.path === pagePath) || pages[0];

  return (
    <Editor page={pageByPath} />
  );
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};