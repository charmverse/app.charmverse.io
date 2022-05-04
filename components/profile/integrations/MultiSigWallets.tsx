/* eslint-disable jsx-a11y/control-has-associated-label */
import styled from '@emotion/styled';
import { Box, Card, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import { usePopupState } from 'material-ui-popup-state/hooks';
import useSWR, { mutate } from 'swr';
import Button from 'components/common/Button';
import Link from 'components/common/Link';
import Legend from 'components/settings/Legend';
import Modal from 'components/common/Modal';
import GnosisSafeForm from 'components/settings/payment-methods/components/GnosisSafeForm';
import ElementDeleteIcon from 'components/common/form/ElementDeleteIcon';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { shortenHex } from 'lib/utilities/strings';
import charmClient from 'charmClient';
import { getChainById } from 'connectors';

interface Wallet {
  id: string;
  name: string | null;
  workspace?: string | null;
  walletType: string;
  chainId: number;
  address: string;
}

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

const walletTypes = {
  gnosis: 'Gnosis Safe Wallet',
  metamask: 'MetaMask'
};

const gnosisUrl = (address: string) => `https://gnosis-safe.io/app/rin:${address}/home`;

export default function MultiSigList () {

  const { data } = useSWR('/profile/multi-sigs', () => charmClient.listUserMultiSigs());

  const gnosisPopupState = usePopupState({ variant: 'popover', popupId: 'gnosis-popup' });
  const deleteConfirmation = usePopupState({ variant: 'popover', popupId: 'delete-confirmation' });

  function onNewWallet () {
    mutate('/profile/multi-sigs');
    gnosisPopupState.close();
  }

  async function deleteWallet (wallet: Wallet) {
    await charmClient.deleteUserMultiSig(wallet.id);
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
                  {walletTypes[wallet.walletType]}
                </TableCell>
                <TableCell>
                  {getChainById(wallet.chainId)?.chainName}
                </TableCell>
                <TableCell>
                  <Tooltip placement='top' title={wallet.address}>
                    <span>
                      <Link external href={gnosisUrl(wallet.address)} target='_blank'>
                        {shortenHex(wallet.address)}
                      </Link>
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ px: 0 }} align='right'>

                  <ElementDeleteIcon onClick={deleteConfirmation.open} />

                  <ConfirmDeleteModal
                    key={wallet.id}
                    title='Delete Wallet'
                    question='Are you sure you want to delete this wallet?'
                    onConfirm={() => deleteWallet(wallet)}
                    onClose={deleteConfirmation.close}
                    open={deleteConfirmation.isOpen}
                  />
                </TableCell>
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
