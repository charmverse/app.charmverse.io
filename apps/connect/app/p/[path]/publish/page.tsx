import { PageTitle } from '@connect/components/common/PageTitle';
import { PageWrapper } from '@connect/components/common/PageWrapper';
import { PublishProjectToGitcoin } from '@connect/components/projects/[id]/PublishProjectToGitcoin';
import { Box } from '@mui/system';

export default function PublishProjectPage({ params }: { params: { id: string } }) {
  return (
    <PageWrapper>
      <Box gap={2} display='flex' flexDirection='column'>
        <PageTitle>Congratulations!</PageTitle>
        <PublishProjectToGitcoin projectId={params.id} />
      </Box>
    </PageWrapper>
  );
}
