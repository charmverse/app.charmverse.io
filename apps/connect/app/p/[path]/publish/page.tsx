import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Box } from '@mui/material';

import { PageTitle } from 'components/common/PageTitle';
import { PublishProjectToGitcoin } from 'components/projects/[id]/PublishProjectToGitcoin';

export default function PublishProjectPage({ params }: { params: { path: string } }) {
  return (
    <PageWrapper>
      <Box gap={2} display='flex' flexDirection='column'>
        <PageTitle>Congratulations!</PageTitle>
        <PublishProjectToGitcoin projectPath={params.path} />
      </Box>
    </PageWrapper>
  );
}
