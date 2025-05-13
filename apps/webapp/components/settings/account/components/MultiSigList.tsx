import type { UserGnosisSafe } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import KeyIcon from '@mui/icons-material/Key';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Box,
  CircularProgress,
  IconButton,
  OutlinedInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { getChainById, getChainShortname } from '@packages/blockchain/connectors/chains';
import { shortenHex } from '@packages/utils/blockchain';
import { useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import Legend from 'components/settings/components/Legend';
import { useImportSafes } from 'hooks/useImportSafes';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';

const StyledTableCell = styled(TableCell)`
  font-weight: 700;
  border-bottom: 1px solid #000;
`;

const gnosisUrl = (address: string, chainId: number) =>
  `https://app.safe.global/${getChainShortname(chainId)}:${address}/home`;

export function MultiSigList() {
  const { data: safeData, mutate } = useMultiWalletSigs();
  const { importSafes, isLoadingSafes } = useImportSafes();
  const { user } = useUser();

  useEffect(() => {
    if (user && user.wallets.length) {
      // We need this to run every time a user opens the account section in the settings modal
      importSafes();
    }
  }, [user?.id]);

  // sort the rows to prevent random order
  const sortedSafes = safeData?.sort((a, b) => (a.address < b.address ? -1 : 1)) || [];

  return (
    <>
      <Legend
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}
        id='multisig-section'
      >
        <Box component='span' display='flex' alignItems='center' gap={1}>
          <KeyIcon fontSize='large' /> Multisig
          {isLoadingSafes && <CircularProgress size={16} sx={{ ml: 1 }} color='secondary' />}
        </Box>
      </Legend>

      {sortedSafes.length === 0 && !isLoadingSafes && <Typography>No safes found</Typography>}
      {sortedSafes.length > 0 && (
        <Table size='small' aria-label='multisig table'>
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

function SafeRow({ safe, updateWallets }: { safe: UserGnosisSafe; updateWallets: () => void }) {
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<{ name: string }>({
    mode: 'onChange',
    defaultValues: { name: safe.name || '' }
  });

  const { trigger: updateSafeWallet, isMutating: isLoadingUpdateSafeWallet } = useSWRMutation(
    '/profile/add-wallets',
    (_url, { arg }: Readonly<{ arg: { id: string; name?: string; isHidden?: boolean } }>) =>
      charmClient.gnosisSafe.updateMyGnosisSafe(arg),
    {
      onSuccess() {
        updateWallets();
      }
    }
  );

  const saveSafeName = useCallback(
    async ({ name }: { name: string }) => {
      const sanitized = name.trim();
      setValue('name', sanitized.length > 500 ? sanitized.substring(0, 500) : sanitized);
      await updateSafeWallet({ id: safe.id, name: sanitized });
    },
    [safe.id]
  );

  return (
    <TableRow key={safe.id} sx={safe.isHidden ? { opacity: 0.5 } : undefined}>
      <TableCell sx={{ pl: 0 }}>
        <Controller
          name='name'
          control={control}
          render={({ field: { onChange, value } }) => (
            <OutlinedInput
              value={value}
              onChange={onChange}
              placeholder='Untitled wallet'
              onBlur={handleSubmit(saveSafeName)}
              endAdornment={<CircularProgress size={14} sx={{ opacity: isSubmitting ? 1 : 0 }} />}
              error={!!errors.name}
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
        <IconButton
          disabled={isLoadingUpdateSafeWallet}
          size='small'
          onClick={() => updateSafeWallet({ id: safe.id, isHidden: !safe.isHidden })}
        >
          {safe.isHidden ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
