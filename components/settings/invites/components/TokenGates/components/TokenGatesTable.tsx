import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/Close';
import { TableHead } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { TokenGate } from '@prisma/client';
import { humanizeAccessControlConditions } from 'lit-js-sdk';
import { useRouter } from 'next/router';
import type { MouseEvent } from 'react';
import { useContext, useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { mutate } from 'swr';

import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import charmClient from 'charmClient';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import ButtonChip from 'components/common/ButtonChip';
import TableRow from 'components/common/Table/TableRow';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import log from 'lib/log';
import type { TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { shortenHex } from 'lib/utilities/strings';

import type { TestResult } from './TestConnectionModal';
import TestConnectionModal from './TestConnectionModal';
import TokenGateRolesSelect from './TokenGateRolesSelect';

interface Props {
  tokenGates: TokenGateWithRoles[];
  isAdmin: boolean;
  onDelete: (tokenGate: TokenGate) => void;
}

const StyledTableRow = styled(TableRow)`
  margin-bottom: 20px;
  background-color: ${({ theme }) => theme.palette.sidebar.background};

  & > th, & > td {
    border-bottom-style: dashed;
  }
`;

function CopyLinkButton ({ clickable = false }: { clickable?: boolean }) {
  return (
    <Chip sx={{ width: 90 }} clickable={clickable} disabled={!clickable} color='secondary' size='small' variant='outlined' label='Copy Link' />
  );
}

export default function TokenGatesTable ({ isAdmin, onDelete, tokenGates }: Props) {
  const { account, walletAuthSignature, sign } = useWeb3AuthSig();
  const [testResult, setTestResult] = useState<TestResult>({});
  const litClient = useLitProtocol();
  const [descriptions, setDescriptions] = useState<(string | null)[]>([]);
  const space = useCurrentSpace();
  const router = useRouter();
  const { showMessage } = useSnackbar();
  const shareLink = `${window.location.origin}/join?domain=${router.query.domain}`;
  const { openWalletSelectorModal } = useContext(Web3Connection);

  function onCopy () {
    showMessage('Link copied to clipboard');
  }

  async function updateTokenGateRoles (tokenGateId: string, roleIds: string[]) {
    if (space) {
      await charmClient.updateTokenGateRoles(tokenGateId, space.id, roleIds);
      mutate(`tokenGates/${space.id}`);
    }
  }

  async function deleteRoleFromTokenGate (tokenGateId: string, roleId: string) {
    const tokenGate = tokenGates.find(_tokenGate => _tokenGate.id === tokenGateId);
    if (tokenGate && space) {
      const roleIds = tokenGate.tokenGateToRoles.map(tokenGateToRole => tokenGateToRole.roleId).filter(tokenGateRoleId => tokenGateRoleId !== roleId);
      await charmClient.updateTokenGateRoles(tokenGateId, space.id, roleIds);
      mutate(`tokenGates/${space.id}`);
    }
  }

  useEffect(() => {
    async function main () {
      const results = await Promise.all(
        tokenGates.map(tokenGate => humanizeAccessControlConditions({
          myWalletAddress: account || '',
          ...tokenGate.conditions as any
        }).catch(err => {
          log.warn('Could not retrieve humanized format of conditions', err);
          return null;
        }))
      );
      setDescriptions(results);
    }
    main();
  }, [tokenGates]);

  async function testConnect (tokenGate: TokenGate) {
    setTestResult({ status: 'loading' });
    try {
      if (!litClient) {
        throw new Error('Lit Protocol client not initialized');
      }
      const authSig = walletAuthSignature ?? await sign();
      const jwt = await litClient.getSignedToken({
        resourceId: tokenGate.resourceId as any,
        authSig,
        chain: (tokenGate.conditions as any).chain || 'ethereum',
        ...tokenGate.conditions as any
      });

      await charmClient.verifyTokenGate({ commit: false, spaceId: space?.id as string, tokens: [{ signedToken: jwt, tokenGateId: tokenGate.id }] });

      setTestResult({ status: 'success' });
    }
    catch (error) {
      log.warn('Error when verifying wallet', error);
      let message = '';
      switch ((error as any).errorCode) {
        case 'not_authorized':
          message = `Address does not meet requirements: ${shortenHex(account || '')}`;
          break;
        default:
          message = (error as Error).message || 'Access denied. Please check your access control conditions.';
      }
      setTestResult({ message, status: 'error' });
    }
  }

  // sort oldest to newest
  const sortedTokenGates = tokenGates.sort((a, b) => b.createdAt > a.createdAt ? -1 : 1);

  const padding = 32;

  return (
    <>
      <Box overflow='auto'>
        <Table size='small' aria-label='Token gates table'>
          <TableHead>
            <StyledTableRow>
              <TableCell sx={{ padding: '20px 16px' }}>
                <Typography variant='body1' fontWeight='600'>
                  Token Gated Link
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 150 }}></TableCell>
              <TableCell sx={{ width: 90 + padding }} align='center'>
                {sortedTokenGates.length === 0
                  ? (
                    <Tooltip title='Add a token gate to use this link'>
                      <span><CopyLinkButton /></span>
                    </Tooltip>
                  )
                  : (
                    <CopyToClipboard text={shareLink} onCopy={onCopy}>
                      <span><CopyLinkButton clickable /></span>
                    </CopyToClipboard>
                  )}
              </TableCell>
              <TableCell sx={{ width: 30 + padding }}>{/** Delete */}</TableCell>
            </StyledTableRow>
          </TableHead>
          <TableBody>
            {sortedTokenGates.length === 0 && (
              <TableRow>
                <TableCell align='center' colSpan={4} sx={{ padding: '20px 16px' }}>This Workspace has no Token Gates</TableCell>
              </TableRow>
            )}
            {sortedTokenGates.map((tokenGate, tokenGateIndex, tokenGateArray) => (
              <TableRow key={tokenGate.id} sx={{ '&:not(:last-child) td': { border: 0 }, marginBottom: 20 }}>
                <TableCell>
                  <Typography variant='caption' sx={{ my: 1, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {descriptions[tokenGateIndex]}
                  </Typography>
                  {tokenGateArray.length === tokenGateIndex + 1 ? null : (
                    <Typography variant='caption' sx={{ mt: 1 }}>
                      -- OR --
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <TokenGateRolesSelect
                    isAdmin={isAdmin}
                    selectedRoleIds={tokenGate.tokenGateToRoles.map(tokenGateToRole => tokenGateToRole.roleId)}
                    onChange={(roleIds) => {
                      updateTokenGateRoles(tokenGate.id, roleIds);
                    }}
                    onDelete={(roleId) => {
                      deleteRoleFromTokenGate(tokenGate.id, roleId);
                    }}
                  />
                </TableCell>
                <TableCell align='center'>
                  <Tooltip arrow placement='top' title={litClient ? (!account ? 'Connect your wallet to test' : 'Test this gate using your own wallet') : 'Lit Protocol client has not initialized'}>
                    <Box component='span'>
                      <Chip
                        onClick={() => {
                          if (litClient) {
                            if (account) {
                              testConnect(tokenGate);
                            }
                            else {
                              openWalletSelectorModal();
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
                        icon={<DeleteIcon />}
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
