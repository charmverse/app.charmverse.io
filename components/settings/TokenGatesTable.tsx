import { useEffect, useState } from 'react';
import { humanizeAccessControlConditions, Chain, checkAndSignAuthMessage, ALL_LIT_CHAINS } from 'lit-js-sdk';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { TokenGate } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import DeleteIcon from '@mui/icons-material/Close';
import ButtonChip from 'components/common/ButtonChip';
import Tooltip from '@mui/material/Tooltip';
import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import Button from 'components/common/Button';
import CheckIcon from '@mui/icons-material/Check';
import Chip from '@mui/material/Chip';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import Avatar from 'components/common/Avatar';
import { Contributor } from 'models';
import getDisplayName from 'lib/users/getDisplayName';
import useENSName from 'hooks/useENSName';
import charmClient from 'charmClient';

export const StyledRow = styled(TableRow)`
  .row-actions {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
  &:hover .row-actions {
    opacity: 1;
  }
`;

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
    const chain = getChain(tokenGate);
    const authSig = await checkAndSignAuthMessage({
      chain
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
          <StyledRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell sx={{ px: 0 }}>
              <Typography>{descriptions[index]}</Typography>
            </TableCell>
            <TableCell width={150}>
              <Typography>{ALL_LIT_CHAINS[getChain(row)]?.name}</Typography>
            </TableCell>
            <TableCell width={150} sx={{ whiteSpace: 'nowrap' }}>
              {new Date(row.createdAt).toDateString()}
            </TableCell>
            <TableCell width={150} sx={{ px: 0, whiteSpace: 'nowrap' }} align='right'>
              <Box component='span' pr={1}>
                <Chip onClick={() => testConnect(row)} sx={{ width: 70 }} clickable color='secondary' size='small' variant='outlined' label='Test' />
              </Box>
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
          </StyledRow>
        ))}
      </TableBody>
    </Table>
  );
}

function getChain (tokenGate: TokenGate): Chain {
  return (tokenGate.conditions as any)!.accessControlConditions![0].chain;
}
