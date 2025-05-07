import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { stringUtils } from '@charmverse/core/utilities';
import type { EasSchemaChain } from '@packages/credentials/connectors';
import type {
  IssuableProposalCredentialContent,
  PartialIssuableProposalCredentialContent
} from '@packages/credentials/findIssuableProposalCredentials';
import { useCallback } from 'react';

import charmClient from 'charmClient';
import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGetIssuableProposalCredentials } from 'charmClient/hooks/proposals';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useGetGnosisSafe } from 'hooks/useGetGnosisSafe';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { useWeb3Signer } from 'hooks/useWeb3Signer';

/**
 * @proposalId - Pass this param to get the credentials for a specific proposal
 */
export function useMultiProposalCredentials({ proposalIds }: { proposalIds?: string[] | null | undefined } = {}) {
  const { space } = useCurrentSpace();
  const {
    data: issuableProposalCredentials,
    error,
    isLoading: isLoadingIssuableProposalCredentials,
    mutate: refreshIssuableCredentials
  } = useGetIssuableProposalCredentials({
    proposalIds
  });

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
      // lazy load credentials to avoid loading eas sdk everywhere
      const { proposalCredentialSchemaId } = await import('@packages/credentials/schemas/proposal');
      const { multiAttestOnchain, populateOnChainAttestationTransaction } = await import(
        '@packages/credentials/multiAttestOnchain'
      );

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

        await charmClient.credentials.requestPendingCredentialGnosisSafeIndexing({
          chainId: space.credentialsChainId as EasSchemaChain,
          safeTxHash,
          safeAddress: gnosisSafeForCredentials.address,
          schemaId: proposalCredentialSchemaId,
          spaceId: space.id,
          credentials: _issuableProposalCredentials.map(
            (ic) =>
              ({
                event: ic.event,
                proposalId: ic.proposalId,
                credentialTemplateId: ic.credentialTemplateId,
                recipientAddress: ic.recipientAddress
              }) as PartialIssuableProposalCredentialContent
          ),
          type: 'proposal'
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
      proposeTransaction,
      space?.id
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

export function useProposalCredentials({ proposalId }: { proposalId: MaybeString }) {
  const { space } = useCurrentSpace();

  const multiCredentials = useMultiProposalCredentials({ proposalIds: proposalId ? [proposalId] : null });

  return {
    ...multiCredentials,
    hasPendingOnchainCredentials:
      !!space?.useOnchainCredentials && !!multiCredentials.issuableProposalCredentials?.length
  };
}
