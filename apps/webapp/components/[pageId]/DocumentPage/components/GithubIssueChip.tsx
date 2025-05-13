import GitHubIcon from '@mui/icons-material/GitHub';
import { Box, Stack } from '@mui/material';

import Link from 'components/common/Link';
import { BreadcrumbPageTitle } from 'components/common/PageLayout/components/Header/components/PageTitleWithBreadcrumbs';

export function GithubIssueChip({ githubIssueUrl }: { githubIssueUrl: string }) {
  const chunks = githubIssueUrl.split('/');
  const issueNumber = chunks[chunks.length - 1];
  const repoName = chunks[chunks.length - 3];
  const username = chunks[chunks.length - 4];

  return (
    <Box sx={{ a: { color: 'inherit' } }}>
      <Link href={githubIssueUrl} external target='_blank'>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <GitHubIcon fontSize='small' />
          <BreadcrumbPageTitle sx={{ maxWidth: 160 }}>{`${username}/${repoName} #${issueNumber}`}</BreadcrumbPageTitle>
        </Stack>
      </Link>
    </Box>
  );
}
