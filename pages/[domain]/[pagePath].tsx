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

  const [pages] = usePages();
  const router = useRouter();
  const { pagePath } = router.query;
  const pageByPath = pages.find(page => page.path === pagePath) || pages[0];

  setTitle(pageByPath.title);

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