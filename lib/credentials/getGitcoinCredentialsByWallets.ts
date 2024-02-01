import { log } from '@charmverse/core/log';

import * as http from 'adapters/http';
import { isTruthy } from 'lib/utilities/types';

import type { EASAttestationFromApi } from './external/getOnchainCredentials';

const GITCOIN_SCORER_BASE_URL = 'https://api.scorer.gitcoin.co';

const GITCOIN_API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-KEY': process.env.GITCOIN_API_KEY
};

const GITCOIN_SCORER_ID = 6441;

type Evidence = {
  type: string;
  success: boolean;
  rawScore: number;
  threshold: number;
};

type ScoreItem = {
  address: string;
  score: string;
  status: string;
  last_score_timestamp: string;
  evidence: Evidence | null;
  error: string;
  stamp_scores: Record<string, unknown>;
};

type GetAddressesGitcoinPassportScoresResponse = {
  items: ScoreItem[];
  count: number;
};

async function getGitcoinPassportScores(wallets: string[]) {
  try {
    const response = await http.GET<GetAddressesGitcoinPassportScoresResponse>(
      `${GITCOIN_SCORER_BASE_URL}/registry/score/${GITCOIN_SCORER_ID}`,
      {
        addresses: wallets.map((wallet) => wallet.toLowerCase()).join(',')
      },
      {
        credentials: 'omit',
        headers: GITCOIN_API_HEADERS
      }
    );

    return response.items;
  } catch (error: any) {
    log.error('Error getting Gitcoin Passport scores', {
      error: error.message,
      wallets
    });
    return [];
  }
}

export async function getGitcoinCredentialsByWallets({
  wallets
}: {
  wallets: string[];
}): Promise<EASAttestationFromApi[]> {
  const gitcoinPassportScores = await getGitcoinPassportScores(wallets);
  return wallets
    .map((wallet) => {
      const gitcoinPassportScore = gitcoinPassportScores.find((score) => score.address === wallet);

      if (!gitcoinPassportScore || !gitcoinPassportScore.evidence) {
        return null;
      }

      const mappedData: EASAttestationFromApi = {
        id: `${wallet}-gitcoin-passport-score`,
        content: {
          passport_score: gitcoinPassportScore.evidence.rawScore
        },
        attester: '0x843829986e895facd330486a61Ebee9E1f1adB1a', // https://optimism.easscan.org/address/0x843829986e895facd330486a61Ebee9E1f1adB1a
        recipient: wallet,
        schemaId: '0x6ab5d34260fca0cfcf0e76e96d439cace6aa7c3c019d7c4580ed52c6845e9c89', // Optimism attestation schema id: https://docs.passport.gitcoin.co/building-with-passport/smart-contracts/contract-reference#eas-schema,
        timeCreated: new Date(gitcoinPassportScore.last_score_timestamp).getTime(),
        chainId: 10,
        type: 'gitcoin',
        verificationUrl: null,
        iconUrl: null
      };

      return mappedData;
    })
    .filter(isTruthy);
}
