import type { BoxProps } from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { StyledBanner } from 'components/common/Banners/Banner';

export function PageWebhookBanner({ type, url, ...restProps }: BoxProps & { type: string; url: string }) {
  return (
    <StyledBanner data-test='page-webhook-banner' {...restProps}>
      <Stack gap={0.5} flexDirection='column' alignItems='center' display='inline-flex'>
        <Typography>This database is receiving responses from {type} via this webhook URL</Typography>
        <Typography>
          <i>{url}</i>
        </Typography>
      </Stack>
    </StyledBanner>
  );
}
