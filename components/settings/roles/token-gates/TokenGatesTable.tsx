import { useEffect, useState } from 'react';
import { checkAndSignAuthMessage, humanizeAccessControlConditions } from 'lit-js-sdk';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { TokenGate } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import DeleteIcon from '@mui/icons-material/Close';
import ButtonChip from 'components/common/ButtonChip';
import Tooltip from '@mui/material/Tooltip';
import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import Chip from '@mui/material/Chip';
import charmClient from 'charmClient';
import TableRow from 'components/common/Table/TableRow';
import { TokenGateWithRoles } from 'pages/api/token-gates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { mutate } from 'swr';
import TestConnectionModal, { TestResult } from './TestConnectionModal';
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
  const [descriptions, setDescriptions] = useState<string[]>([]);
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
          // accessControlConditions: (tokenGate.conditions as any)?.accessControlConditions || []
        }))
      );
      setDescriptions(results);
    }
    main();
  }, [tokenGates]);

  async function testConnect (tokenGate: TokenGate) {
    setTestResult({ status: 'loading' });
    try {
      const authSig = await checkAndSignAuthMessage({
        chain: (tokenGate.conditions as any).chain || 'ethereum'
      });
      const jwt = await litClient!.getSignedToken({
        resourceId: tokenGate.resourceId as any,
        authSig,
        chain: (tokenGate.conditions as any).chain || 'ethereum',
        ...tokenGate.conditions as any
      });
      await charmClient.verifyTokenGate({ jwt, id: tokenGate.id });

      setTestResult({ status: 'success' });
    }
    catch (error) {
      const message = (error as Error).message || 'Access denied. Please check your access control conditions.';
      setTestResult({ message, status: 'error' });
    }
  }

  return (
    <>
      <Table size='small' aria-label='simple table'>
        <TableHead>
          <TableRow>
            <TableCell sx={{ px: 0 }}>Description</TableCell>
            <TableCell>
              <Tooltip arrow placement='top' title='Automatically assign these roles to new users'>
                <span>Included Roles</span>
              </Tooltip>
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tokenGates.map((tokenGate, tokenGateIndex) => (
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
                <Tooltip arrow placement='top' title='Test this gate using your own wallet'>
                  <Box component='span' pr={1}>
                    <Chip onClick={() => testConnect(tokenGate)} sx={{ width: 70 }} clickable color='secondary' size='small' variant='outlined' label='Test' />
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
