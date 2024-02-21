import { log } from '@charmverse/core/log';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import { useContext, useState } from 'react';

import { useVerifyTokenGate } from 'charmClient/hooks/tokenGates';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import Loader from 'components/common/Loader';
import TableRow from 'components/common/Table/TableRow';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { TokenGate, TokenGateWithRoles } from 'lib/tokenGates/interfaces';

import { CopyLink } from './CopyLink';
import type { TestResult } from './TestConnectionModal';
import { TestConnectionModal } from './TestConnectionModal';
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
  const { account, walletAuthSignature, requestSignature } = useWeb3Account();
  const isMobile = useSmallScreen();
  const [testResult, setTestResult] = useState<TestResult>({});
  const { space } = useCurrentSpace();
  const { connectWallet } = useContext(Web3Connection);
  const { trigger: verifyTokenGate } = useVerifyTokenGate();

  async function testConnect(tokenGate: TokenGate) {
    if (account) {
      const authSig = walletAuthSignature ?? (await requestSignature());

      setTestResult({ status: 'loading' });

      await verifyTokenGate(
        {
          commit: false,
          spaceId: space?.id || '',
          tokenGateIds: [tokenGate.id],
          authSig,
          walletAddress: account || ''
        },
        {
          onError: (error) => {
            log.warn('Error when verifying wallet', error);
            setTestResult({ message: 'Your address does not meet the requirements', status: 'error' });
          },
          onSuccess: () => {
            setTestResult({ status: 'success' });
          }
        }
      );
    } else {
      connectWallet();
    }
  }

  return (
    <>
      <Box overflow='auto'>
        <Table size='small' aria-label='Token gates table'>
          <TableHead>
            <StyledTableRow>
              <TableCell sx={{ padding: isMobile ? '20px 0 20px 16px' : '20px 16px' }} colSpan={isMobile ? 2 : 0}>
                <Typography variant='body1' fontWeight='600'>
                  Token Gated Link
                </Typography>
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
                testConnect={testConnect}
              />
            ))}
          </TableBody>
        </Table>
      </Box>
      <TestConnectionModal
        status={testResult.status}
        message={testResult.message}
        open={!!testResult.status}
        onClose={() => setTestResult({})}
      />
    </>
  );
}
