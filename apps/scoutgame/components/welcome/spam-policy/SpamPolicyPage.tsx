import { Button, List, ListItem, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';

export function SpamPolicyPage() {
  return (
    <SinglePageLayout>
      <SinglePageWrapper>
        <Typography variant='h5' color='secondary' mb={2}>
          Spam Policy
        </Typography>
        <Typography mb={2}>The Scout Game has a strict no spam policy.</Typography>
        <Typography mb={2}>
          If 3 of your PRs are rejected, your account will be labeled as spam. You will be suspended from Scout Game and
          unable to score points.
        </Typography>
        <Typography mb={2}>
          If you are suspended, you may appeal this decision. An appeal link will be included in the suspension
          notification.
        </Typography>
        <Button fullWidth href='/welcome/how-it-works' data-test='continue-button'>
          Continue
        </Button>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
