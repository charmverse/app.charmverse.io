/* eslint-disable jsx-a11y/control-has-associated-label */
import styled from '@emotion/styled';
import KeyIcon from '@mui/icons-material/Key';
import { Box, CircularProgress, OutlinedInput, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { getChainById, getChainShortname } from 'connectors';
import log from 'loglevel';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import ElementDeleteIcon from 'components/common/form/ElementDeleteIcon';
import Link from 'components/common/Link';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { MultiSigConnectCard } from 'components/integrations/components/MultiSigConnectCard';
import Legend from 'components/settings/Legend';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import useGnosisSigner from 'hooks/useWeb3Signer';
import { importSafesFromWallet } from 'lib/gnosis/gnosis.importSafes';
import { shortenHex } from 'lib/utilities/strings';

interface Safe {
  id: string;
  name: string | null;
  workspace?: string | null;
  chainId: number;
  address: string;
}

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

const gnosisUrl = (address: string, chainId: number) =>
  `https://app.safe.global/${getChainShortname(chainId)}:${address}/home`;

export function MultiSigList() {
  const { data: safeData, mutate } = useMultiWalletSigs();
  const { showMessage } = useSnackbar();

  const gnosisSigner = useGnosisSigner();
  const { user } = useUser();
  const [isLoadingSafes, setIsLoadingSafes] = useState(false);

  async function importSafes() {
    if (gnosisSigner && user) {
      setIsLoadingSafes(true);
      try {
        const safesCount = await importSafesFromWallet({
          signer: gnosisSigner,
          addresses: user.wallets.map((w) => w.address),
          getWalletName
        });

        if (!safesCount) {
          showMessage('You do not have any gnosis wallets', 'warning');
        }
        await mutate();
      } catch (e) {
        log.error('Error importing safes', e);

        showMessage('We could not import your safes', 'error');
      } finally {
        setIsLoadingSafes(false);
      }
    }
  }

  function getWalletName(address: string) {
    return safeData?.find((wallet) => wallet.address === address)?.name;
  }

  if (!safeData) {
    return null;
  }

  // sort the rows to prevent random order
  const sortedSafes = safeData.sort((a, b) => (a.address < b.address ? -1 : 1));

  return (
    <>
      <Legend
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        marginTop={(theme) => theme.spacing(4)}
      >
        <Box component='span' display='flex' alignItems='center' gap={1}>
          <KeyIcon fontSize='large' /> Multisig
        </Box>

        {sortedSafes.length > 0 && (
          <Button loading={isLoadingSafes} onClick={importSafes} variant='outlined' sx={{ float: 'right' }}>
            Sync Gnosis Safes
          </Button>
        )}
      </Legend>

      {sortedSafes.length === 0 && (
        <MultiSigConnectCard connectable={!!gnosisSigner} loading={isLoadingSafes} onClick={importSafes} />
      )}

      {sortedSafes.length > 0 && (
        <Table size='small' aria-label='simple table'>
          <TableHead>
            <TableRow>
              <StyledTableCell sx={{ pl: 0 }}>Wallet Name</StyledTableCell>
              <StyledTableCell>Blockchain</StyledTableCell>
              <StyledTableCell>Address</StyledTableCell>
              <StyledTableCell></StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedSafes.map((safe) => (
              <SafeRow updateWallets={mutate} safe={safe} key={safe.id} />
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function SafeRow({ safe, updateWallets }: { safe: Safe; updateWallets: () => void }) {
  const deleteConfirmation = usePopupState({ variant: 'popover', popupId: 'delete-confirmation' });

  const {
    control,
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
    setValue
  } = useForm<{ name: string }>({
    mode: 'onChange',
    defaultValues: { name: safe.name || '' }
  });

  useEffect(() => {
    setValue('name', safe.name || '');
  }, [safe.name]);

  async function deleteSafe(_safe: Safe) {
    await charmClient.deleteMyGnosisSafe(_safe.id);
    updateWallets();
    deleteConfirmation.close();
  }

  async function saveSafeName({ name }: { name: string }) {
    if (isDirty) {
      const sanitized = name.trim();
      await charmClient.updateMyGnosisSafe({ id: safe.id, name: sanitized });
      await updateWallets();
      reset(); // reset form
    }
  }

  return (
    <TableRow key={safe.id}>
      <TableCell sx={{ pl: 0 }}>
        <Controller
          name='name'
          control={control}
          render={({ field: { onChange, value } }) => (
            <OutlinedInput
              value={value}
              onChange={onChange}
              placeholder='Untitled'
              onBlur={handleSubmit(saveSafeName)}
              endAdornment={<CircularProgress size={14} sx={{ opacity: isSubmitting ? 1 : 0 }} />}
            />
          )}
        />
      </TableCell>
      <TableCell>{getChainById(safe.chainId)?.chainName}</TableCell>
      <TableCell>
        <Tooltip placement='top' title={safe.address}>
          <span>
            <Link external href={gnosisUrl(safe.address, safe.chainId)} target='_blank'>
              {shortenHex(safe.address)}
            </Link>
          </span>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ pr: 0 }} align='right'>
        <ElementDeleteIcon onClick={deleteConfirmation.open} />

        <ConfirmDeleteModal
          key={safe.id}
          title='Delete Wallet'
          question='Are you sure you want to delete this wallet?'
          onConfirm={() => deleteSafe(safe)}
          onClose={deleteConfirmation.close}
          open={deleteConfirmation.isOpen}
        />
      </TableCell>
    </TableRow>
  );
}
