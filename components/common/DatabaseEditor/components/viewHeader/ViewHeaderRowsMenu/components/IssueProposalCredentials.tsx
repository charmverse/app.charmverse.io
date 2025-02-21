import type { SystemError } from '@charmverse/core/errors';
import MedalIcon from '@mui/icons-material/WorkspacePremium';
import { Box, ListItemText, Tooltip } from '@mui/material';
import { getChainById } from '@packages/blockchain/connectors/chains';
import type { IssuableProposalCredentialContent } from '@packages/credentials/findIssuableProposalCredentials';
import { conditionalPlural } from '@packages/utils/strings';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { StyledMenuItem } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/PropertyMenu';
import { useMultiProposalCredentials } from 'components/proposals/hooks/useProposalCredentials';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import { useSwitchChain } from 'hooks/wagmi';

export function IssueProposalCredentials({
  selectedPageIds,
  asMenuItem,
  onIssueCredentialsSuccess
}: {
  selectedPageIds: string[];
  asMenuItem?: boolean;
  onIssueCredentialsSuccess?: () => void;
}) {
  const { getFeatureTitle } = useSpaceFeatures();

  const { space } = useCurrentSpace();

  const proposalLabel = getFeatureTitle('proposal');

  const {
    issuableProposalCredentials,
    issueAndSaveProposalCredentials,
    isLoadingIssuableProposalCredentials,
    userWalletCanIssueCredentialsForSpace,
    gnosisSafeForCredentials
  } = useMultiProposalCredentials({ proposalIds: selectedPageIds });
  const { showMessage } = useSnackbar();

  const [publishingCredential, setPublishingCredential] = useState(false);

  const { account, chainId } = useWeb3Account();
  const { signer } = useWeb3Signer();
  const { switchChainAsync } = useSwitchChain();

  async function handleIssueCredentials(_issuableProposalCredentials: IssuableProposalCredentialContent[]) {
    if (!signer || !space?.useOnchainCredentials || !space.credentialsChainId) {
      return;
    }

    if (chainId !== space.credentialsChainId) {
      await switchChainAsync?.({ chainId: space.credentialsChainId });
      return;
    }

    setPublishingCredential(true);

    try {
      const result = await issueAndSaveProposalCredentials(_issuableProposalCredentials);
      if (result === 'gnosis') {
        showMessage('Transaction submitted to Gnosis Safe. Please execute it there');
      } else {
        const issuedCredentialAmount = _issuableProposalCredentials.length;
        showMessage(
          `Issued ${issuedCredentialAmount} ${proposalLabel} ${conditionalPlural({
            count: issuedCredentialAmount,
            word: 'credential'
          })}`
        );
      }
      onIssueCredentialsSuccess?.();
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

  const disableIssueCredentials =
    !space?.useOnchainCredentials || !space.credentialsChainId || !space.credentialsWallet
      ? 'A space admin must set up onchain credentials to use this functionality'
      : publishingCredential
        ? 'Issuing credentials...'
        : !issuableProposalCredentials?.length
          ? 'No onchain credentials to issue'
          : !account || !signer
            ? 'Unlock your wallet to issue credentials'
            : !userWalletCanIssueCredentialsForSpace
              ? gnosisSafeForCredentials
                ? `You must be connected as one of the owners of the ${gnosisSafeForCredentials.address} Gnosis Safe on ${
                    getChainById(space?.credentialsChainId)?.chainName
                  }`
                : `You must be connected with wallet ${space?.credentialsWallet} to issue credentials`
              : undefined;

  async function _handleIssueCredentials() {
    if (!space?.credentialsChainId) {
      return;
    }

    if (chainId !== space?.credentialsChainId) {
      await switchChainAsync?.({ chainId: space.credentialsChainId })
        .then(() => {
          handleIssueCredentials(issuableProposalCredentials ?? []);
        })
        .catch();
    } else {
      handleIssueCredentials(issuableProposalCredentials ?? []);
    }
  }

  // We only enable this feature if the space has onchain credentials enabled
  if (!space?.useOnchainCredentials || !space.credentialsChainId) {
    return null;
  }

  return (
    <Tooltip title={disableIssueCredentials}>
      <Box>
        {asMenuItem ? (
          <div>
            <StyledMenuItem onClick={_handleIssueCredentials} disabled={!!disableIssueCredentials}>
              <MedalIcon
                fontSize='small'
                sx={{
                  mr: 1
                }}
              />
              <ListItemText primary='Issue onchain' />
            </StyledMenuItem>
          </div>
        ) : (
          <Button
            onClick={() => handleIssueCredentials(issuableProposalCredentials ?? [])}
            variant='contained'
            color='primary'
            loading={publishingCredential || (isLoadingIssuableProposalCredentials && !issuableProposalCredentials)}
            disabled={disableIssueCredentials}
          >
            Issue onchain
          </Button>
        )}
      </Box>
    </Tooltip>
  );
}
