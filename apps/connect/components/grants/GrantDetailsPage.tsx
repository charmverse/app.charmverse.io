import { Box, Button, CardContent, Link, Stack, Typography } from '@mui/material';
import React from 'react';

import { Avatar } from '../common/Avatar';
import { ExpandableDescription } from '../common/ExpandableDescription';
import { PageCoverHeader } from '../common/PageCoverHeader';
import { PageWrapper } from '../common/PageWrapper';

import type { Grant } from './GrantsDetailsPage';

export function GrantDetailsPage({ grant }: { grant: Grant }) {
  return (
    <PageWrapper header={<PageCoverHeader name={grant.name} avatar={grant.logo} coverImage={grant.banner} />}>
      <Stack data-test='project-details'>
        <Stack direction='row' mb={2} justifyContent='space-between' alignItems='center' flexWrap='wrap' gap={0.5}>
          <Typography variant='h5' data-test='project-name'>
            {grant.name}
          </Typography>
        </Stack>
        {grant.description && <ExpandableDescription description={grant.description} />}
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
