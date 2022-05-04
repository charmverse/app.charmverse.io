import { useState } from 'react';
import { checkAndSignAuthMessage } from 'lit-js-sdk';
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
import { getLitChainFromChainId } from 'lib/token-gates';
import { TokenGateWithRoles } from 'pages/api/token-gates';
import TestConnectionModal, { TestResult } from './TestConnectionModal';
import TokenGateRolesSelect from './TokenGateRolesSelect';
import useRoles from '../roles/hooks/useRoles';
import { useTokenGates } from './hooks/useTokenGates';

interface Props {
  tokenGates: TokenGateWithRoles[];
  isAdmin: boolean;
  onDelete: (tokenGate: TokenGate) => void;
}

export default function TokenGatesTable ({ isAdmin, onDelete, tokenGates }: Props) {
  const { chainId } = useWeb3React();
  const { tokenGateDescriptions, updateTokenGateRoles, deleteRoleFromTokenGate } = useTokenGates();
  const [testResult, setTestResult] = useState<TestResult>({});
  const litClient = useLitProtocol();
  const { roles } = useRoles();
  async function testConnect (tokenGate: TokenGate) {
    const chain = getLitChainFromChainId(chainId);
    setTestResult({ status: 'loading' });
    try {
      const authSig = await checkAndSignAuthMessage({
        chain
      });
      const jwt = await litClient!.getSignedToken({
        resourceId: tokenGate.resourceId as any,
        authSig,
        chain,
        accessControlConditions: (tokenGate.conditions as any).accessControlConditions
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
            <TableCell>Roles</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tokenGates.map((tokenGate) => (
            <TableRow key={tokenGate.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, marginBottom: 20 }}>
              <TableCell sx={{ px: 0 }}>
                <Typography sx={{
                  my: 1
                }}
                >{tokenGateDescriptions[tokenGate.id]}
                </Typography>
              </TableCell>
              <TableCell>
                {roles?.length !== 0 && (
                  <TokenGateRolesSelect
                    selectedRoleIds={tokenGate.tokenGateToRoles.map(tokenGateToRole => tokenGateToRole.roleId)}
                    onChange={(roleIds) => {
                      updateTokenGateRoles(tokenGate.id, roleIds);
                    }}
                    onDelete={(roleId) => {
                      deleteRoleFromTokenGate(tokenGate.id, roleId);
                    }}
                  />
                )}
              </TableCell>
              <TableCell width={150} sx={{ px: 0, whiteSpace: 'nowrap' }} align='right'>
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
