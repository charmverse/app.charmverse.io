import { PageLayout } from 'components/common/page-layout';
import { usePageTitle } from 'hooks/usePageTitle';
import { DatabaseEditor } from 'components/databases';
import { Editor } from 'components/editor';
import { usePages } from 'hooks/usePages';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { ReactElement, useEffect } from 'react';

export default function BountyPage () {
  return <div>TODO: put the bounty cards here</div>;
}

BountyPage.getLayout = (page: ReactElement) => {
  return <PageLayout>{page}</PageLayout>;
};
