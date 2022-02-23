import { useState } from 'react';
import styled from '@emotion/styled';
import Table from '@mui/material/Table';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Countdown from 'react-countdown';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Close';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { getDisplayName } from 'lib/users';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import { InviteLinkPopulated } from 'pages/api/invites/index';

const StyledRow = styled(TableRow)`
  .row-actions {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
  &:hover .row-actions {
    opacity: 1;
  }
`;

const ButtonChip = styled(Chip)`
  box-sizing: content-box;
  .MuiSvgIcon-root {
    margin: 0;
    width: 24px;
  }
  .MuiChip-label {
    display: none;
  }

`;

interface Props {
  invites: InviteLinkPopulated[];
  onDelete: (invite: InviteLinkPopulated) => void;
}

export default function InvitesTable (props: Props) {

  const [copied, setCopied] = useState<{ [id: string]: boolean }>({});

  function onCopy (id: string) {
    setCopied({ [id]: true });
    setTimeout(() => setCopied({ [id]: false }), 1000);
  }

  return (
    <Table size='small' aria-label='simple table'>
      <TableHead>
        <TableRow>
          <TableCell>Inviter</TableCell>
          <TableCell>Invite Code</TableCell>
          <TableCell>Uses</TableCell>
          <TableCell>Expires</TableCell>
          <TableCell>{/* actions */}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {props.invites.map((row) => (
          <StyledRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell>
              <Typography><strong>{getDisplayName(row.author)}</strong></Typography>
            </TableCell>
            <TableCell><Typography>{row.code}</Typography></TableCell>
            <TableCell>
              <Typography>
                {row.useCount}
                {row.maxUses > 0 ? ` / ${row.maxUses}` : ''}
              </Typography>
            </TableCell>
            <TableCell>{getExpires(row)}</TableCell>
            <TableCell align='right'>
              <Tooltip
                arrow
                placement='top'
                title={copied[row.id] ? 'Copied' : 'Click to copy link'}
                disableInteractive
              >
                <Box component='span' pr={1}>
                  <CopyToClipboard text={getInviteLink(row.code)} onCopy={() => onCopy(row.id)}>
                    <Chip clickable color='secondary' size='small' variant='outlined' label='Share' />
                  </CopyToClipboard>
                </Box>
              </Tooltip>
              <Tooltip arrow placement='top' title='Delete'>
                <ButtonChip
                  className='row-actions'
                  icon={<DeleteIcon />}
                  clickable
                  color='secondary'
                  size='small'
                  variant='outlined'
                  onClick={() => props.onDelete(row)}
                />
              </Tooltip>
            </TableCell>
          </StyledRow>
        ))}
      </TableBody>
    </Table>
  );
}

function getInviteLink (code: string) {
  return `${window.location.origin}/invite/${code}`;
}

function getExpires (row: InviteLinkPopulated) {
  if (row.maxAgeMinutes > 0) {
    const expireDate = new Date(row.createdAt).getTime() + (row.maxAgeMinutes * 60 * 1000);
    if (expireDate < Date.now()) {
      return (
        <Tooltip arrow placement='top' title={`Expired on ${new Date(expireDate).toDateString()}`}>
          <Typography component='span'>Expired</Typography>
        </Tooltip>
      );
    }
    return (
      <Tooltip arrow placement='top' title={`Expires on ${new Date(expireDate).toDateString()}`}>
        <span><Countdown date={expireDate} /></span>
      </Tooltip>
    );
  }
  return <AllInclusiveIcon fontSize='small' />;
}
