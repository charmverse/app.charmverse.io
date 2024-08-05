import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { stringUtils } from '@charmverse/core/utilities';
import { useCallback } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useGetGnosisSafe } from 'hooks/useGetGnosisSafe';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { useWeb3Signer } from 'hooks/useWeb3Signer';
import type { EasSchemaChain } from 'lib/credentials/connectors';
import type {
  IssuableRewardApplicationCredentialContent,
  PartialIssuableRewardApplicationCredentialContent
} from 'lib/credentials/findIssuableRewardCredentials';
import { multiAttestOnchain, populateOnChainAttestationTransaction } from 'lib/credentials/multiAttestOnchain';
import { rewardCredentialSchemaId } from 'lib/credentials/schemas/reward';

export function useRewardCredentials() {
  const { space } = useCurrentSpace();

  const { account } = useWeb3Account();

  const { signer } = useWeb3Signer();

  const {
    gnosisSafe: gnosisSafeForCredentials,
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

  const issueAndSaveRewardCredentials = useCallback(
    async (_issuableRewardCredentials: IssuableRewardApplicationCredentialContent[]) => {
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
          type: 'reward',
          credentialInputs: _issuableRewardCredentials.map((ic) => ({
            recipient: ic.recipientAddress,
            data: ic.credential
          }))
        });
        const safeTxHash = await proposeTransaction({ safeTransactionData: { ...populatedTransaction, value: '0' } });

        await charmClient.credentials.requestPendingCredentialGnosisSafeIndexing({
          chainId: space.credentialsChainId as EasSchemaChain,
          safeTxHash,
          safeAddress: gnosisSafeForCredentials.address,
          schemaId: rewardCredentialSchemaId,
          spaceId: space.id,
          credentials: _issuableRewardCredentials.map(
            (ic) =>
              ({
                event: ic.event,
                rewardId: ic.rewardId,
                credentialTemplateId: ic.credentialTemplateId,
                recipientAddress: ic.recipientAddress,
                rewardApplicationId: ic.rewardApplicationId
              } as PartialIssuableRewardApplicationCredentialContent)
          ),
          type: 'reward'
        });
        return 'gnosis';
      } else {
        const txOutput = await multiAttestOnchain({
          chainId: space?.credentialsChainId as EasSchemaChain,
          type: 'reward',
          signer,
          credentialInputs: _issuableRewardCredentials.map((ic) => ({
            recipient: ic.recipientAddress,
            data: ic.credential
          }))
        });
        await charmClient.credentials.requestRewardCredentialIndexing({
          chainId: space.credentialsChainId as EasSchemaChain,
          txHash: txOutput.tx.hash
        });
        return 'wallet';
      }
    },
    [signer, userWalletCanIssueCredentialsForSpace, gnosisSafeForCredentials, proposeTransaction]
  );

  return {
    issueAndSaveRewardCredentials,
    userWalletCanIssueCredentialsForSpace,
    gnosisSafeForCredentials
  };
}
