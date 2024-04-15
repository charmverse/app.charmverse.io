import type { SystemError } from '@charmverse/core/errors';
import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Chip, Divider, ListItemText, MenuItem, Tooltip } from '@mui/material';
import { getChainById } from 'connectors/chains';
import { useMemo, useState } from 'react';
import { useSwitchChain } from 'wagmi';

import { Button } from 'components/common/Button';
import { Chain } from 'components/common/form/InputSearchBlockchain';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import { useRewardCredentials } from 'components/rewards/hooks/useRewardCredentials';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import type { EasSchemaChain } from 'lib/credentials/connectors';
import { getOnChainSchemaUrl } from 'lib/credentials/connectors';
import type { IssuableRewardApplicationCredentialContent } from 'lib/credentials/findIssuableRewardCredentials';
import { rewardCredentialSchemaId } from 'lib/credentials/schemas/reward';

import { PropertyMenu } from './PropertyMenu';

function IssueCredentialRow({
  label,
  disabled,
  handleIssueCredentials,
  issuableCredentials
}: {
  label: string;
  handleIssueCredentials: (issuableCredentials: IssuableRewardApplicationCredentialContent[]) => void;
  disabled: boolean;
  issuableCredentials: IssuableRewardApplicationCredentialContent[];
}) {
  return (
    <MenuItem disabled={disabled} onClick={() => handleIssueCredentials(issuableCredentials)} sx={{ gap: 2 }}>
      <ListItemText primary={label} />
      <Chip size='small' label={issuableCredentials?.length} sx={{ fontWeight: 'bold' }} />
    </MenuItem>
  );
}

export function IssueRewardCredentials({ selectedPageIds }: { selectedPageIds: string[] }) {
  const { getFeatureTitle } = useSpaceFeatures();

  const { space } = useCurrentSpace();

  const {
    issuableRewardCredentials,
    issueAndSaveRewardCredentials,
    isLoadingIssuableRewardCredentials,
    userWalletCanIssueCredentialsForSpace,
    gnosisSafeForCredentials
  } = useRewardCredentials();
  const { showMessage } = useSnackbar();

  const filteredCredentials = (issuableRewardCredentials ?? []).filter((issuable) =>
    selectedPageIds.includes(issuable.rewardPageId)
  );

  const [publishingCredential, setPublishingCredential] = useState(false);

  const { account, chainId } = useWeb3Account();
  const { signer } = useWeb3Signer();
  const { switchChainAsync } = useSwitchChain();

  async function handleIssueCredentials(_issuableRewardCredentials: IssuableRewardApplicationCredentialContent[]) {
    if (!signer || !space?.useOnchainCredentials || !space.credentialsChainId) {
      return;
    }

    if (chainId !== space.credentialsChainId) {
      await switchChainAsync?.({ chainId: space.credentialsChainId });
      return;
    }

    setPublishingCredential(true);

    try {
      const result = await issueAndSaveRewardCredentials(_issuableRewardCredentials);
      if (result === 'gnosis') {
        showMessage('Transaction submitted to Gnosis Safe. Please execute it there');
      } else {
        showMessage(`Issued ${_issuableRewardCredentials.length} reward credentials`);
      }
    } catch (err: any) {
      if (err.code === 'ACTION_REJECTED') {
        showMessage('Transaction rejected', 'warning');
      } else {
        showMessage(err.message ?? 'Error issuing credentials', (err as SystemError).severity ?? 'error');
      }
      // Hook handles errors
    } finally {
      setPublishingCredential(false);
    }
  }

  const disableIssueCredentialsMenu =
    !space?.useOnchainCredentials || !space.credentialsChainId || !space.credentialsWallet
      ? 'A space admin must set up onchain credentials to use this functionality'
      : !issuableRewardCredentials?.length
      ? 'No credentials to issue'
      : !account || !signer
      ? 'Unlock your wallet to issue credentials'
      : !userWalletCanIssueCredentialsForSpace
      ? gnosisSafeForCredentials
        ? `You must be connected as one of the owners of the ${gnosisSafeForCredentials.address} Gnosis Safe on ${
            getChainById(space?.credentialsChainId)?.chainName
          }`
        : `You must be connected with wallet ${space?.credentialsWallet} to issue credentials`
      : undefined;

  const disableIssueCredentialRows =
    !!disableIssueCredentialsMenu || publishingCredential || chainId !== space?.credentialsChainId;

  const chainComponent = useMemo(() => {
    if (!space?.credentialsChainId || !chainId) {
      return null;
    }
    const chain = getChainById(chainId);
    if (!chain) {
      return null;
    }

    const userHasCorrectChain = !!space?.credentialsChainId && chainId === space?.credentialsChainId;

    return (
      <MenuItem sx={{ display: 'block' }}>
        {userHasCorrectChain ? (
          <Link
            external
            target='_blank'
            sx={{ color: 'black' }}
            href={getOnChainSchemaUrl({
              chainId: space.credentialsChainId as EasSchemaChain,
              schema: rewardCredentialSchemaId
            })}
          >
            <Chain info={chain} />
          </Link>
        ) : (
          <>
            <Chain info={chain} />
            <Tooltip title='Your wallet must on the correct chain to issue credentials for this space'>
              <Button
                sx={{ mt: 1 }}
                fullWidth
                onClick={() => switchChainAsync?.({ chainId: space.credentialsChainId as number }).catch()}
                variant='outlined'
                size='small'
              >
                Switch chain
              </Button>
            </Tooltip>
          </>
        )}
      </MenuItem>
    );
  }, [space?.credentialsChainId, chainId, switchChainAsync]);

  // We only enable this feature if the space has onchain credentials enabled
  if (
    !space?.useOnchainCredentials ||
    !space.credentialsChainId ||
    (isLoadingIssuableRewardCredentials && !issuableRewardCredentials)
  ) {
    return null;
  }

  return (
    <PropertyMenu
      lastChild={false}
      disabledTooltip={disableIssueCredentialsMenu}
      // add fontSize to icon to override MUI styles
      propertyTemplate={{ icon: <MedalIcon sx={{ fontSize: '16px !important' }} />, name: 'Issue Onchain Credentials' }}
    >
      {chainComponent}
      <Divider />

      <IssueCredentialRow
        disabled={disableIssueCredentialRows}
        issuableCredentials={filteredCredentials ?? []}
        handleIssueCredentials={handleIssueCredentials}
        label='Submission approved'
      />
      {publishingCredential && (
        <MenuItem sx={{ gap: 2 }}>
          <LoadingComponent size={20} />
          <ListItemText primary='Publishing credentials' />
        </MenuItem>
      )}
    </PropertyMenu>
  );
}
