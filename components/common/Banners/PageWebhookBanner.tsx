import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { StyledBanner } from './Banner';

export function PageWebhookBanner({ type, url }: { type: string; url: string }) {
  return (
    <StyledBanner data-test='page-webhook-banner'>
      <Stack gap={0.5} flexDirection='column' alignItems='center' display='inline-flex'>
        <Typography>This database is receiving responses from {type} via this webhook URL</Typography>
        <Typography>
          <i>{url}</i>
        </Typography>
      </Stack>
    </StyledBanner>
  );
}
