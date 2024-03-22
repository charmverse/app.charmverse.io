import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { stringUtils } from '@charmverse/core/utilities';
import { useCallback } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useGetGnosisSafe } from 'hooks/useGetGnosisSafe';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import type { EasSchemaChain } from 'lib/credentials/connectors';
import type { IssuableProposalCredentialContent } from 'lib/credentials/findIssuableProposalCredentials';
import { multiAttestOnchain, populateOnChainAttestationTransaction } from 'lib/credentials/multiAttestOnchain';
import { proposalCredentialSchemaId } from 'lib/credentials/schemas/proposal';

export function useProposalCredentials() {
  const { space } = useCurrentSpace();
  const {
    data: issuableProposalCredentials,
    error,
    isLoading: isLoadingIssuableProposalCredentials,
    mutate: refreshIssuableCredentials
  } = useSWR(space ? `/api/credentials/proposals?spaceId=${space.id}` : null, () =>
    charmClient.credentials.getIssuableProposalCredentials({ spaceId: space?.id as string })
  );

  const { account } = useWeb3Account();

  const { signer } = useWeb3Signer();

  const {
    gnosisSafe: gnosisSafeForCredentials,
    safeApiClient,
    isLoadingSafe,
    currentWalletIsSafeOwner,
    proposeTransaction
  } = useGetGnosisSafe({
    address: space?.credentialsWallet,
    chainId: space?.credentialsChainId as number
  });

  const userWalletCanIssueCredentialsForSpace =
    !!space?.credentialsWallet &&
    account &&
    (stringUtils.lowerCaseEqual(space?.credentialsWallet, account) || currentWalletIsSafeOwner);
  // || gnosisSafeForCredentials?.owners.some((owner) => lowerCaseEqual(owner, account)));

  const issueAndSaveProposalCredentials = useCallback(
    async (_issuableProposalCredentials: IssuableProposalCredentialContent[]) => {
      if (!space || !space?.credentialsChainId || !signer) {
        log.debug('No credentials chain ID or signer');
        return;
      }
      if (!userWalletCanIssueCredentialsForSpace) {
        throw new InvalidInputError('Your wallet cannot issue credentials for this space');
      }

      if (gnosisSafeForCredentials) {
        const populatedTransaction = await populateOnChainAttestationTransaction({
          chainId: space.credentialsChainId as EasSchemaChain,
          type: 'proposal',
          credentialInputs: _issuableProposalCredentials.map((ic) => ({
            recipient: ic.recipientAddress,
            data: ic.credential
          }))
        });
        const safeTxHash = await proposeTransaction({ safeTransactionData: { ...populatedTransaction, value: '0' } });

        await charmClient.credentials.requestPendingProposalCredentialGnosisSafeIndexing({
          chainId: space.credentialsChainId as EasSchemaChain,
          safeTxHash,
          safeAddress: gnosisSafeForCredentials.address,
          schemaId: proposalCredentialSchemaId,
          spaceId: space.id,
          credentials: _issuableProposalCredentials.map((ic) => ({
            event: ic.event,
            proposalId: ic.proposalId,
            credentialTemplateId: ic.credentialTemplateId,
            recipientAddress: ic.recipientAddress
          }))
        });
        await refreshIssuableCredentials();
        return 'gnosis';
      } else {
        const txOutput = await multiAttestOnchain({
          chainId: space?.credentialsChainId as EasSchemaChain,
          type: 'proposal',
          signer,
          credentialInputs: _issuableProposalCredentials.map((ic) => ({
            recipient: ic.recipientAddress,
            data: ic.credential
          }))
        });
        await charmClient.credentials.requestProposalCredentialIndexing({
          chainId: space.credentialsChainId as EasSchemaChain,
          txHash: txOutput.tx.hash
        });
        await refreshIssuableCredentials();
        return 'wallet';
      }
    },
    [
      signer,
      userWalletCanIssueCredentialsForSpace,
      gnosisSafeForCredentials,
      refreshIssuableCredentials,
      proposeTransaction
    ]
  );

  return {
    issuableProposalCredentials,
    isLoadingIssuableProposalCredentials,
    error,
    refreshIssuableCredentials,
    issueAndSaveProposalCredentials,
    userWalletCanIssueCredentialsForSpace,
    gnosisSafeForCredentials
  };
}
