import { useEffect, useState } from 'react';
import { humanizeAccessControlConditions, checkAndSignAuthMessage, ALL_LIT_CHAINS } from 'lit-js-sdk';
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
import { getChainFromGate } from 'lib/token-gates';

interface Props {
  tokenGates: TokenGate[];
  isAdmin: boolean;
  onDelete: (tokenGate: TokenGate) => void;
}

export default function ContributorRow ({ isAdmin, onDelete, tokenGates }: Props) {

  const { account } = useWeb3React();
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const litClient = useLitProtocol();

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
    const chain = getChainFromGate(tokenGate);
    const authSig = await checkAndSignAuthMessage({
      chain: 'ethereum'
    });
    const jwt = await litClient!.getSignedToken({
      resourceId: tokenGate.resourceId as any,
      authSig,
      chain,
      accessControlConditions: (tokenGate.conditions as any)!.accessControlConditions
    });
    const authMessage = await charmClient.verifyTokenGate({ jwt, id: tokenGate.id });
    if (authMessage) {
      alert('Success!');
    }
  }

  return (
    <Table size='small' aria-label='simple table'>
      <TableHead>
        <TableRow>
          <TableCell sx={{ px: 0 }}>Description</TableCell>
          <TableCell>Chain</TableCell>
          <TableCell>Created</TableCell>
          <TableCell>{/* actions */}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tokenGates.map((row, index) => (
          <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell sx={{ px: 0 }}>
              <Typography>{descriptions[index]}</Typography>
            </TableCell>
            <TableCell width={150}>
              <Typography>{ALL_LIT_CHAINS[getChainFromGate(row)]?.name}</Typography>
            </TableCell>
            <TableCell width={150} sx={{ whiteSpace: 'nowrap' }}>
              {new Date(row.createdAt).toDateString()}
            </TableCell>
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
  );
}
