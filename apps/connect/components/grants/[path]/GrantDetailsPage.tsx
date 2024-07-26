import 'server-only';

import { Button, Chip, Link, Stack, Typography } from '@mui/material';

import type { Grant } from 'lib/grants/getGrants';

import { PageCoverHeader } from '../../common/PageCoverHeader';
import { PageWrapper } from '../../common/PageWrapper';
import { ProjectDescription } from '../../common/ProjectDescription';

export function GrantDetailsPage({ grant }: { grant: Grant }) {
  return (
    <PageWrapper header={<PageCoverHeader name={grant.name} avatar={grant.logo} coverImage={grant.banner} />}>
      <Stack data-test='project-details'>
        <Stack mb={2} gap={1}>
          <Typography variant='h5' data-test='project-name'>
            {grant.name}
          </Typography>
          <Chip
            sx={{ width: 'fit-content' }}
            label={grant.open ? 'Open' : 'Closed'}
            variant='outlined'
            color={grant.open ? 'success' : 'error'}
            size='small'
          />
        </Stack>
        {grant.description && <ProjectDescription description={grant.description} />}
        {grant.applyLink && (
          <Stack direction='row' justifyContent='center' my={2}>
            <Link href={grant.applyLink} target='_blank'>
              <Button size='large'>Apply</Button>
            </Link>
          </Stack>
        )}
      </Stack>
    </PageWrapper>
  );
}
