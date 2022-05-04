import { useEffect, useState } from 'react';
import { humanizeAccessControlConditions, checkAndSignAuthMessage } from 'lit-js-sdk';
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
import TestConnectionModal, { TestResult } from './TestConnectionModal';
import TokenGateRolesSelect from './TokenGateRolesSelect';
import useRoles from '../roles/hooks/useRoles';

interface Props {
  tokenGates: TokenGate[];
  isAdmin: boolean;
  onDelete: (tokenGate: TokenGate) => void;
}

export default function ContributorRow ({ isAdmin, onDelete, tokenGates }: Props) {
  const { account, chainId } = useWeb3React();
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<TestResult>({});
  const litClient = useLitProtocol();
  const { roles } = useRoles();

  useEffect(() => {
    Promise.all(tokenGates.map(tokenGate => humanizeAccessControlConditions({
      myWalletAddress: account || '',
      accessControlConditions: (tokenGate.conditions as any)?.accessControlConditions || []
    })))
      .then(result => {
        setDescriptions(result);
      });
  }, [tokenGates]);

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
            <TableCell></TableCell>
            {/* <TableCell></TableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>
          {tokenGates.map((row, index) => (
            <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, marginBottom: 20 }}>
              <TableCell sx={{ px: 0 }}>
                <Typography sx={{
                  my: 1
                }}
                >{descriptions[index]}
                </Typography>
                {roles?.length !== 0 && <TokenGateRolesSelect />}
              </TableCell>
              {/* <TableCell sx={{ width: '150px' }}>
                {roles?.length !== 0 && <Button size='small' variant='outlined' onClick={() => setShowingTokenGateRolesModal(true)}>Attach Roles</Button>}
              </TableCell> */}
              <TableCell width={150} sx={{ px: 0, whiteSpace: 'nowrap' }} align='right'>
                <Tooltip arrow placement='top' title='Test this gate using your own wallet'>
                  <Box component='span' pr={1}>
                    <Chip onClick={() => testConnect(row)} sx={{ width: 70 }} clickable color='secondary' size='small' variant='outlined' label='Test' />
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
                    onClick={() => onDelete(row)}
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
