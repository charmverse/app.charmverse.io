import EastIcon from '@mui/icons-material/East';
import { Stack } from '@mui/material';

import { AlertBanner } from 'components/common/Banners/Alert';
import Link from 'components/common/Link';

export function ProposalBanner({ type, proposalId }: { type: 'page' | 'post'; proposalId: string }) {
  return (
    <AlertBanner severity='info' data-test='proposal-banner'>
      This {type} has been converted to a proposal and is read-only now. You can continue the conversation{' '}
      <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
        <Link color='inherit' href={`/${proposalId}`} sx={{ fontWeight: 600 }}>
          here
        </Link>
        <EastIcon sx={{ position: 'relative', top: 1.5, fontSize: 16 }} />
      </Stack>
    </AlertBanner>
  );
}
