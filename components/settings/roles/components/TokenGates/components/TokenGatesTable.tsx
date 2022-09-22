import DeleteIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { TokenGate } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import charmClient from 'charmClient';
import ButtonChip from 'components/common/ButtonChip';
import TableRow from 'components/common/Table/TableRow';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import log from 'lib/log';
import getLitChainFromChainId from 'lib/token-gates/getLitChainFromChainId';
import type { TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { shortenHex } from 'lib/utilities/strings';
import { checkAndSignAuthMessage, humanizeAccessControlConditions } from 'lit-js-sdk';
import { useEffect, useState } from 'react';
import { mutate } from 'swr';
import type { TestResult } from './TestConnectionModal';
import TestConnectionModal from './TestConnectionModal';
import TokenGateRolesSelect from './TokenGateRolesSelect';

interface Props {
  tokenGates: TokenGateWithRoles[];
  isAdmin: boolean;
  onDelete: (tokenGate: TokenGate) => void;
}

export default function TokenGatesTable ({ isAdmin, onDelete, tokenGates }: Props) {
  const { account, chainId } = useWeb3React();
  const [testResult, setTestResult] = useState<TestResult>({});
  const litClient = useLitProtocol();
  const [descriptions, setDescriptions] = useState<(string | null)[]>([]);
  const [space] = useCurrentSpace();

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
      const chain = getLitChainFromChainId(chainId);
      const authSig = await checkAndSignAuthMessage({ chain });
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

  return (
    <>
      <Table size='small' aria-label='simple table'>
        <TableHead>
          <TableRow>
            <TableCell sx={{ px: 0 }}>Description</TableCell>
            <TableCell>
              <Tooltip arrow placement='top' title='Automatically assign these roles to new users'>
                <Typography fontSize='small' noWrap>Assigned Roles</Typography>
              </Tooltip>
            </TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedTokenGates.map((tokenGate, tokenGateIndex) => (
            <TableRow key={tokenGate.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, marginBottom: 20 }}>
              <TableCell sx={{ px: 0 }}>
                <Typography variant='body2' sx={{ my: 1 }}>
                  {descriptions[tokenGateIndex]}
                </Typography>
              </TableCell>
              <TableCell>
                <TokenGateRolesSelect
                  selectedRoleIds={tokenGate.tokenGateToRoles.map(tokenGateToRole => tokenGateToRole.roleId)}
                  onChange={(roleIds) => {
                    updateTokenGateRoles(tokenGate.id, roleIds);
                  }}
                  onDelete={(roleId) => {
                    deleteRoleFromTokenGate(tokenGate.id, roleId);
                  }}
                />
              </TableCell>
              <TableCell width={140} sx={{ px: 0, whiteSpace: 'nowrap' }} align='right'>
                <Tooltip arrow placement='top' title={litClient ? 'Test this gate using your own wallet' : 'Lit Protocol client has not initialized'}>
                  <Box component='span' pr={1}>
                    <Chip onClick={() => litClient && testConnect(tokenGate)} sx={{ width: 70 }} clickable={Boolean(litClient)} color='secondary' size='small' variant='outlined' label='Test' />
                  </Box>
                </Tooltip>
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
      <TestConnectionModal
        status={testResult.status}
        message={testResult.message}
        open={!!testResult.status}
        onClose={() => setTestResult({})}
      />
    </>
  );
}
