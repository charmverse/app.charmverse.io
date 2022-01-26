import { ReactElement } from 'react';
import { Editor } from 'components/editor';
import { PageLayout } from 'components/common/page-layout';
import { setTitle } from 'components/common/page-layout/PageTitle';

export default function BlocksEditorPage () {

  setTitle('Welcome!');

  return (
    <Editor />
  );
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};