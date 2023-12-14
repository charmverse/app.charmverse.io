import { log } from '@charmverse/core/log';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import { useContext, useState } from 'react';

import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import { useVerifyTokenGate } from 'charmClient/hooks/tokenGates';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import TableRow from 'components/common/Table/TableRow';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { TokenGate, TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import { shortenHex } from 'lib/utilities/blockchain';

import { CopyLink } from './CopyLink';
import type { TestResult } from './TestConnectionModal';
import { TestConnectionModal } from './TestConnectionModal';
import { TokenGateTableRow } from './TokenGatesTableRow';

interface Props {
  isAdmin: boolean;
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

export default function TokenGatesTable({ isAdmin, tokenGates, refreshTokenGates }: Props) {
  const { account, walletAuthSignature, requestSignature } = useWeb3Account();
  const isMobile = useSmallScreen();
  const [testResult, setTestResult] = useState<TestResult>({});
  const litClient = useLitProtocol();
  const { space } = useCurrentSpace();
  const { connectWallet } = useContext(Web3Connection);
  const { trigger: verifyTokenGate } = useVerifyTokenGate();

  async function testLitTokenGate(tokenGate: TokenGate<'lit'>) {
    setTestResult({ status: 'loading' });
    try {
      if (!litClient) {
        throw new Error('Lit Protocol client not initialized');
      }
      const authSig = walletAuthSignature ?? (await requestSignature());
      const jwt = await litClient.getSignedToken({
        resourceId: tokenGate.resourceId,
        authSig,
        chain: tokenGate.conditions.chains?.[0],
        // chain: (tokenGate.conditions).chain || 'ethereum',
        ...tokenGate.conditions
      });

      if (account && space?.id) {
        await verifyTokenGate(
          {
            commit: false,
            spaceId: space.id,
            tokens: [{ signedToken: jwt, tokenGateId: tokenGate.id }],
            walletAddress: account
          },
          {
            onSuccess: () => {
              setTestResult({ status: 'success' });
            }
          }
        );
      }
    } catch (error) {
      log.warn('Error when verifying wallet', error);
      let message = '';
      switch ((error as any).errorCode) {
        case 'NodeNotAuthorized':
          message = `Your address does not meet requirements: ${shortenHex(account || '')}`;
          break;
        case 'rpc_error':
          message = 'Network error. Please check that the access control conditions are valid.';
          break;
        default:
          message = (error as Error).message || 'Unknown error. Please try again.';
      }
      setTestResult({ message, status: 'error' });
    }
  }

  async function testUnlock(tokenGate: TokenGate<'unlock'>) {
    setTestResult({ status: 'loading' });
    if (space?.id && account) {
      await verifyTokenGate(
        {
          commit: false,
          spaceId: space.id,
          tokens: [{ signedToken: '', tokenGateId: tokenGate.id }],
          walletAddress: account
        },
        {
          onError: () => {
            setTestResult({ message: 'Your address does not meet the requirements for this lock', status: 'error' });
          },
          onSuccess: () => {
            setTestResult({
              message: `Your address does not meet requirements: ${shortenHex(account)}`,
              status: 'success'
            });
          }
        }
      );
    }
  }

  async function testConnect(tokenGate: TokenGate) {
    if (account) {
      if (tokenGate.type === 'unlock') {
        await testUnlock(tokenGate);
      } else if (litClient && tokenGate.type === 'lit') {
        await testLitTokenGate(tokenGate);
      }
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
              <TableCell sx={{ padding: '20px 16px' }}>
                <Typography variant='body1' fontWeight='600' mr={6} display='inline-flex'>
                  Token Gated Link
                </Typography>
                {isMobile && <CopyLink tokenGatesAvailable={tokenGates.length > 0} spaceDomain={space?.domain} />}
              </TableCell>
              <TableCell sx={{ width: 150 }}></TableCell>
              <TableCell sx={{ width: 90 + padding }} align='center'>
                {!isMobile && <CopyLink tokenGatesAvailable={tokenGates.length > 0} spaceDomain={space?.domain} />}
              </TableCell>
              <TableCell sx={{ width: 30 + padding }}>{/** Delete */}</TableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {tokenGates.length === 0 && (
              <TableRow>
                <TableCell align='center' colSpan={4} sx={{ padding: '20px 16px' }}>
                  This Space has no Token Gates
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
