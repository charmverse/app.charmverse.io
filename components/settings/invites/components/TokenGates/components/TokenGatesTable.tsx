import { log } from '@charmverse/core/log';
import styled from '@emotion/styled';
import type { HumanizedAccsProps } from '@lit-protocol/types';
import DeleteOutlinedIcon from '@mui/icons-material/Close';
import { TableHead } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useContext, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import charmClient from 'charmClient';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import ButtonChip from 'components/common/ButtonChip';
import TableRow from 'components/common/Table/TableRow';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { humanizeConditions, humanizeConditionsData } from 'lib/tokenGates/humanizeConditions';
import type { TokenGate, TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import { shortenHex } from 'lib/utilities/blockchain';

import type { TestResult } from './TestConnectionModal';
import { TestConnectionModal } from './TestConnectionModal';
import TokenGateRolesSelect from './TokenGateRolesSelect';

interface Props {
  tokenGates: TokenGateWithRoles[];
  isAdmin: boolean;
  onDelete: (tokenGate: { id: string }) => void;
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

function CopyLinkButton({ clickable = false }: { clickable?: boolean }) {
  return (
    <Chip
      sx={{ width: 90 }}
      clickable={clickable}
      disabled={!clickable}
      color='secondary'
      size='small'
      variant='outlined'
      label='Copy Link'
    />
  );
}

export default function TokenGatesTable({ isAdmin, onDelete, tokenGates, refreshTokenGates }: Props) {
  const { account, walletAuthSignature, requestSignature } = useWeb3Account();
  const isMobile = useSmallScreen();
  const [testResult, setTestResult] = useState<TestResult>({});
  const litClient = useLitProtocol();
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const shareLink = `${window.location.origin}/join?domain=${space?.domain}`;
  const { connectWallet } = useContext(Web3Connection);

  const descriptions = tokenGates.map((tokenGate) => {
    const conditionsData = humanizeConditionsData({
      myWalletAddress: account || '',
      ...(tokenGate.conditions as HumanizedAccsProps)
    });

    return humanizeConditions(conditionsData);
  });

  function onCopy() {
    showMessage('Link copied to clipboard');
  }

  async function updateTokenGateRoles(tokenGateId: string, roleIds: string[]) {
    if (space) {
      await charmClient.updateTokenGateRoles(tokenGateId, space.id, roleIds);
      await refreshTokenGates();
    }
  }

  async function deleteRoleFromTokenGate(tokenGateId: string, roleId: string) {
    const tokenGate = tokenGates.find((_tokenGate) => _tokenGate.id === tokenGateId);
    if (tokenGate && space) {
      const roleIds = tokenGate.tokenGateToRoles
        .map((tokenGateToRole) => tokenGateToRole.role.id)
        .filter((tokenGateRoleId) => tokenGateRoleId !== roleId);
      await charmClient.updateTokenGateRoles(tokenGateId, space.id, roleIds);
      await refreshTokenGates();
    }
  }

  async function testConnect(tokenGate: TokenGate) {
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

      await charmClient.tokenGates.verifyTokenGate({
        commit: false,
        spaceId: space?.id as string,
        tokens: [{ signedToken: jwt, tokenGateId: tokenGate.id }]
      });

      setTestResult({ status: 'success' });
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

  // sort oldest to newest
  const sortedTokenGates = tokenGates.sort((a, b) => (b.createdAt > a.createdAt ? -1 : 1));

  const padding = 32;

  const copyLink =
    sortedTokenGates.length === 0 ? (
      <Tooltip title='Add a token gate to use this link'>
        <span>
          <CopyLinkButton />
        </span>
      </Tooltip>
    ) : (
      <CopyToClipboard text={shareLink} onCopy={onCopy}>
        <span>
          <CopyLinkButton clickable />
        </span>
      </CopyToClipboard>
    );

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
                {isMobile && copyLink}
              </TableCell>
              <TableCell sx={{ width: 150 }}></TableCell>
              <TableCell sx={{ width: 90 + padding }} align='center'>
                {!isMobile && copyLink}
              </TableCell>
              <TableCell sx={{ width: 30 + padding }}>{/** Delete */}</TableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {sortedTokenGates.length === 0 && (
              <TableRow>
                <TableCell align='center' colSpan={4} sx={{ padding: '20px 16px' }}>
                  This Space has no Token Gates
                </TableCell>
              </TableRow>
            )}
            {sortedTokenGates.map((tokenGate, tokenGateIndex, tokenGateArray) => (
              <TableRow key={tokenGate.id} sx={{ '&:not(:last-child) td': { border: 0 }, marginBottom: 20 }}>
                <TableCell>
                  <Typography variant='body2' my={1}>
                    {descriptions[tokenGateIndex]}
                  </Typography>
                </TableCell>
                <TableCell>
                  <TokenGateRolesSelect
                    isAdmin={isAdmin}
                    selectedRoleIds={tokenGate.tokenGateToRoles.map(({ role }) => role.id)}
                    onChange={(roleIds) => {
                      updateTokenGateRoles(tokenGate.id, roleIds);
                    }}
                    onDelete={(roleId) => {
                      deleteRoleFromTokenGate(tokenGate.id, roleId);
                    }}
                  />
                </TableCell>
                <TableCell align='center'>
                  <Tooltip
                    arrow
                    placement='top'
                    title={
                      litClient
                        ? !account
                          ? 'Connect your wallet to test'
                          : 'Test this gate using your own wallet'
                        : 'Lit Protocol client has not initialized'
                    }
                  >
                    <Box component='span'>
                      <Chip
                        onClick={() => {
                          if (litClient) {
                            if (account) {
                              testConnect(tokenGate);
                            } else {
                              connectWallet();
                            }
                          }
                        }}
                        sx={{ width: 90 }}
                        clickable={Boolean(account && litClient)}
                        color='secondary'
                        size='small'
                        variant='outlined'
                        label='Test'
                      />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell width={30}>
                  {isAdmin && (
                    <Tooltip arrow placement='top' title='Delete'>
                      <ButtonChip
                        className='row-actions'
                        icon={<DeleteOutlinedIcon />}
                        clickable
                        color='secondary'
                        size='small'
                        variant='outlined'
                        onClick={() => onDelete(tokenGate)}
                      />
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
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
