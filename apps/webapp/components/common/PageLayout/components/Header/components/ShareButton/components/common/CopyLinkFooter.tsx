import { Box, Divider } from '@mui/material';

import { CopyPageLinkAction } from 'components/common/PageActions/components/CopyPageLinkAction';

export function CopyLinkFooter({ pagePath, onCopyLink }: { pagePath?: string; onCopyLink: VoidFunction }) {
  return (
    <>
      <Divider sx={{ my: 1 }} />
      <Box display='flex' justifyContent='flex-end'>
        <CopyPageLinkAction typographyProps={{ variant: 'caption' }} path={`/${pagePath}`} onComplete={onCopyLink} />
      </Box>
    </>
  );
}
