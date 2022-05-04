/* eslint-disable jsx-a11y/control-has-associated-label */
import styled from '@emotion/styled';
import { Box, Card, Chip, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import { usePopupState } from 'material-ui-popup-state/hooks';
import useSWR, { mutate } from 'swr';
import Button from 'components/common/Button';
import Link from 'components/common/Link';
import Legend from 'components/settings/Legend';
import Modal from 'components/common/Modal';
import GnosisSafeForm from 'components/settings/payment-methods/components/GnosisSafeForm';
import { shortenHex } from 'lib/utilities/strings';
import charmClient from 'charmClient';

interface Wallet {
  name: string;
  workspace: string | null;
  type: string;
  chain: string;
  address: string;
}

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

export default function MultiSigList () {

  const { data } = useSWR('/profile/multi-sigs', () => charmClient.listUserMultiSigs());

  const wallets: Wallet[] = [
    // { name: 'Aave', workspace: null, type: 'Gnosis Safe', chain: 'Ethereum', address: '0xE7faB335A404a09ACcE83Ae5F08723d8e5c69b58' },
    // { name: 'Juicebox', workspace: 'Juicebox', type: 'Gnosis Safe', chain: 'Ethereum', address: '0xabC8De1353Fb4E1fC83246B1b561aECC40f43E24' }
  ];

  const gnosisPopupState = usePopupState({ variant: 'popover', popupId: 'gnosis-popup' });

  const gnosisUrl = (address: string) => `https://gnosis-safe.io/app/rin:${address}/home`;

  function onNewWallet () {
    mutate('/profile/multi-sigs');
    gnosisPopupState.close();
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <Legend sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display='flex' alignItems='center' gap={1}>
          <KeyIcon fontSize='large' /> Multisig
        </Box>

        {data.length > 0 && (
          <Button
            onClick={gnosisPopupState.open}
            variant='outlined'
            sx={{ float: 'right' }}
          >
            Add Gnosis Safe wallet
          </Button>
        )}
      </Legend>

      {data.length === 0 && (
        <Card variant='outlined'>
          <Box p={3} textAlign='center'>
            <Typography color='secondary'>Connect a wallet to view pending transactions under <Link href='/profile/tasks'>My Tasks</Link></Typography>
            <br />
            <Button
              onClick={gnosisPopupState.open}
            >
              Add Gnosis Safe wallet
            </Button>
          </Box>
        </Card>
      )}
      {data.length > 0 && (
        <Table size='small' aria-label='simple table'>
          <TableHead>
            <TableRow>
              <StyledTableCell sx={{ px: 0 }}>Wallet Name</StyledTableCell>
              <StyledTableCell>Workspace</StyledTableCell>
              <StyledTableCell>Wallet Type</StyledTableCell>
              <StyledTableCell>Blockchain</StyledTableCell>
              <StyledTableCell>Address</StyledTableCell>
              <StyledTableCell></StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
            data.map(wallet => (
              <TableRow key={wallet.id}>
                <TableCell sx={{ px: 0 }}>{wallet.name}</TableCell>
                <TableCell>
                  {/* {wallet.workspace} */}
                </TableCell>
                <TableCell>
                  {wallet.walletType}
                </TableCell>
                <TableCell>
                  {wallet.chainId}
                </TableCell>
                <TableCell>
                  <Tooltip placement='top' title={wallet.address}>
                    <Link external href={gnosisUrl(wallet.address)} target='_blank'>
                      {shortenHex(wallet.address)}
                    </Link>
                  </Tooltip>
                </TableCell>
                <TableCell><Chip label='Sign' variant='outlined' /></TableCell>
              </TableRow>
            ))
          }
          </TableBody>
        </Table>
      )}
      <Modal title='Add a Gnosis Safe wallet' open={gnosisPopupState.isOpen} onClose={gnosisPopupState.close} size='500px'>
        <GnosisSafeForm isPersonalSafe={true} onSubmit={onNewWallet} />
      </Modal>
    </>
  );
}
