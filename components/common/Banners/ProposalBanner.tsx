import EastIcon from '@mui/icons-material/East';
import { Typography, Stack } from '@mui/material';
import { useRouter } from 'next/router';

import Link from 'components/common/Link';

import { StyledBanner } from './Banner';

export function ProposalBanner({ type, proposalId }: { type: 'page' | 'post'; proposalId: string }) {
  const router = useRouter();
  return (
    <StyledBanner data-test='proposal-banner'>
      <Typography>
        This {type} has been converted to a proposal and is read-only now. You can continue the conversation{' '}
        <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
          <Link color='inherit' href={`/${router.query.domain}/${proposalId}`} sx={{ fontWeight: 600 }}>
            here
          </Link>
          <EastIcon sx={{ position: 'relative', top: 1.5, fontSize: 16 }} />
        </Stack>
      </Typography>
    </StyledBanner>
  );
}
