import { log } from '@charmverse/core/log';
import { useCallback } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import type { EasSchemaChain } from 'lib/credentials/connectors';
import type { IssuableProposalCredentialContent } from 'lib/credentials/findIssuableProposalCredentials';
import { multiAttestOnchain } from 'lib/credentials/multiAttestOnchain';

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

  const { signer } = useWeb3Signer();

  const issueAndSaveProposalCredentials = useCallback(
    async (_issuableProposalCredentials: IssuableProposalCredentialContent[]) => {
      if (!space || !space?.credentialsChainId || !signer) {
        log.debug('No credentials chain ID or signer');
        return;
      }

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
      refreshIssuableCredentials();
    },
    [refreshIssuableCredentials, signer, space?.credentialsChainId]
  );

  return {
    issuableProposalCredentials,
    isLoadingIssuableProposalCredentials,
    error,
    refreshIssuableCredentials,
    issueAndSaveProposalCredentials
  };
}
