import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import Loader from 'components/common/Loader';
import TableRow from 'components/common/Table/TableRow';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { TokenGateWithRoles } from 'lib/tokenGates/interfaces';

import { CopyLink } from './CopyLink';
import { TestConnectionModal } from './TestConnectionModal';
import { TokenGateMessageButton } from './TokenGateMessageButton';
import { TokenGateTableRow } from './TokenGatesTableRow';

interface Props {
  isAdmin: boolean;
  isLoading: boolean;
  tokenGates: TokenGateWithRoles[];
  refreshTokenGates: () => Promise<void>;
}

const StyledTableRow = styled(TableRow)`
  margin-bottom: 20px;
  background-color: ${({ theme }) => theme.palette.sidebar.background};

  & > th,
  & > td {
    border-bottom-style: dashed;
  }
`;

const padding = 32;

export default function TokenGatesTable({ isAdmin, isLoading, tokenGates, refreshTokenGates }: Props) {
  const { account } = useWeb3Account();
  const isMobile = useSmallScreen();
  const { space } = useCurrentSpace();
  const [tokenGateIdToTest, setTokenGateIdToTest] = useState<string | undefined>();

  return (
    <>
      <Box overflow='auto'>
        <Table size='small' aria-label='Token gates table'>
          <TableHead>
            <StyledTableRow>
              <TableCell
                sx={{ display: 'flex', gap: 3, p: 2, paddingRight: isMobile ? 0 : 2 }}
                colSpan={isMobile ? 2 : 0}
              >
                <Typography noWrap lineHeight='30px' variant='body1' fontWeight='600'>
                  Token Gated Link
                </Typography>
                <TokenGateMessageButton />
              </TableCell>
              {!isMobile && <TableCell width={150} />}
              <TableCell sx={{ width: 90 + padding }} align='center'>
                <CopyLink tokenGatesAvailable={tokenGates.length > 0} spaceDomain={space?.domain} />
              </TableCell>
              <TableCell sx={{ width: 30 + padding }} />
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {tokenGates.length === 0 && (
              <TableRow>
                <TableCell align='center' colSpan={4} sx={{ padding: '20px 16px' }}>
                  {isLoading ? <Loader size={20} /> : 'This Space has no Token Gates'}
                </TableCell>
              </TableRow>
            )}
            {tokenGates.map((tokenGate) => (
              <TokenGateTableRow
                key={tokenGate.id}
                isAdmin={isAdmin}
                spaceId={space?.id}
                account={account}
                tokenGate={tokenGate}
                refreshTokenGates={refreshTokenGates}
                testConnect={({ id }) => setTokenGateIdToTest(id)}
              />
            ))}
          </TableBody>
        </Table>
      </Box>
      <TestConnectionModal
        open={!!tokenGateIdToTest}
        tokenGateId={tokenGateIdToTest}
        onClose={() => setTokenGateIdToTest(undefined)}
      />
    </>
  );
}
