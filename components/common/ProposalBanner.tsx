import styled from '@emotion/styled';
import EastIcon from '@mui/icons-material/East';
import { Typography } from '@mui/material';
import { Box, Stack } from '@mui/system';
import { useRouter } from 'next/router';

import Link from 'components/common/Link';

const StyledProposalBanner = styled(Box)<{ card?: boolean }>`
  width: 100%;
  z-index: var(--z-index-appBar);
  display: flex;
  justify-content: center;
  color: ${({ theme }) => theme.palette.text.primary};
  background-color: var(--bg-blue);
  padding: ${({ theme }) => theme.spacing(1.4)};
`;

export function ProposalBanner({ type, proposalId }: { type: 'page' | 'post'; proposalId: string }) {
  const router = useRouter();
  return (
    <StyledProposalBanner data-test='proposal-banner'>
      <Typography>
        This {type} has been converted to a proposal and is read-only now. You can continue the conversation{' '}
        <Stack gap={0.5} flexDirection='row' alignItems='center' display='inline-flex'>
          <Link
            color='inherit'
            href={`/${router.query.domain}/${proposalId}`}
            sx={{
              fontWeight: 600
            }}
          >
            here
          </Link>
          <EastIcon sx={{ position: 'relative', top: 1.5, fontSize: 16 }} />
        </Stack>
      </Typography>
    </StyledProposalBanner>
  );
}
