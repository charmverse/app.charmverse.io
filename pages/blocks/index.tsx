import { ReactElement } from 'react';
import { Editor } from 'components/editor';
import { PageLayout } from 'components/common/page-layout';

export default function BlocksEditorPage () {
  return (
    <Editor />
  );
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  console.log('get editor layout', page);
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};