/* eslint-disable jsx-a11y/control-has-associated-label */
import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { Box, Card, CircularProgress, OutlinedInput, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import { WalletType } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import useSWR from 'swr';
import Button from 'components/common/Button';
import Link from 'components/common/Link';
import Legend from 'components/settings/Legend';
import ElementDeleteIcon from 'components/common/form/ElementDeleteIcon';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { shortenHex } from 'lib/utilities/strings';
import charmClient from 'charmClient';
import { getChainById } from 'connectors';
import useGnosisSigner from 'hooks/useWeb3Signer';
import { useUser } from 'hooks/useUser';
import { getSafesForAddresses } from 'lib/gnosis';
import { Controller, useForm } from 'react-hook-form';

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

  const { data, mutate } = useSWR('/profile/multi-sigs', () => charmClient.listUserMultiSigs(), { revalidateOnFocus: false });

  const gnosisSigner = useGnosisSigner();
  const [user] = useUser();
  const [isLoadingSafes, setIsLoadingSafes] = useState(false);

  async function importSafes () {
    if (gnosisSigner && user) {
      setIsLoadingSafes(true);
      try {
        const safes = await getSafesForAddresses(gnosisSigner, user.addresses);
        const safesData = safes.map(safe => ({
          address: safe.address,
          chainId: safe.chainId,
          name: getWalletName(safe.address) // get existing name if user gave us one
        }));
        await charmClient.setUserMultiSigs(safesData);
        await mutate();
      }
      finally {
        setIsLoadingSafes(false);
      }
    }
  }

  function getWalletName (address: string) {
    return data?.find(wallet => wallet.address === address)?.name;
  }

  if (!data) {
    return null;
  }

  // sort the rows to prevent random order
  const sortedRows = data.sort((a, b) => a.address < b.address ? -1 : 1);

  return (
    <>
      <Legend sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box component='span' display='flex' alignItems='center' gap={1}>
          <KeyIcon fontSize='large' /> Multisig
        </Box>

        {sortedRows.length > 0 && (
          <Button
            loading={isLoadingSafes}
            onClick={importSafes}
            variant='outlined'
            sx={{ float: 'right' }}
          >
            Sync Gnosis Safes
          </Button>
        )}
      </Legend>

      {sortedRows.length === 0 && (
        <Card variant='outlined'>
          <Box p={3} textAlign='center'>
            <Typography color='secondary'>Import your Gnosis safes to view pending transactions under <Link href='/profile/tasks'>My Tasks</Link></Typography>
            <br />
            <Button
              loading={!gnosisSigner || isLoadingSafes}
              onClick={importSafes}
            >
              Import Gnosis Safes
            </Button>
          </Box>
        </Card>
      )}

      {sortedRows.length > 0 && (
        <Table size='small' aria-label='simple table'>
          <TableHead>
            <TableRow>
              <StyledTableCell sx={{ pl: 0 }}>Wallet Name</StyledTableCell>
              <StyledTableCell>Wallet Type</StyledTableCell>
              <StyledTableCell>Blockchain</StyledTableCell>
              <StyledTableCell>Address</StyledTableCell>
              <StyledTableCell></StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              sortedRows.map(wallet => (
                <WalletRow updateWallets={mutate} wallet={wallet} key={wallet.id} />
              ))
            }
          </TableBody>
        </Table>
      )}
    </>
  );
}

function WalletRow ({ wallet, updateWallets }: { wallet: Wallet, updateWallets: () => void }) {

  const deleteConfirmation = usePopupState({ variant: 'popover', popupId: 'delete-confirmation' });

  const {
    control,
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
    setValue
  } = useForm<{ name: string }>({
    mode: 'onChange',
    defaultValues: { name: wallet.name || '' }
  });

  useEffect(() => {
    setValue('name', wallet.name || '');
  }, [wallet.name]);

  async function deleteWallet (_wallet: Wallet) {
    await charmClient.deleteUserMultiSig(_wallet.id);
    updateWallets();
    deleteConfirmation.close();
  }

  async function saveWalletName ({ name }: { name: string }) {
    if (isDirty) {
      const sanitized = name.trim();
      await charmClient.updateUserMultiSig({ id: wallet.id, name: sanitized });
      await updateWallets();
      reset(); // reset form
    }
  }

  return (
    <TableRow key={wallet.id}>
      <TableCell sx={{ pl: 0 }}>
        <Controller
          name='name'
          control={control}
          render={({ field: { onChange, value } }) => (
            <OutlinedInput
              value={value}
              onChange={onChange}
              placeholder='Untitled'
              onBlur={handleSubmit(saveWalletName)}
              endAdornment={
                <CircularProgress size={14} sx={{ opacity: isSubmitting ? 1 : 0 }} />
              }
            />
          )}
        />
      </TableCell>
      <TableCell>
        {walletTypes[wallet.walletType as WalletType] || null}
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
      <TableCell sx={{ pr: 0 }} align='right'>

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
  );
}
