import { log } from '@charmverse/core/log';

import * as http from 'adapters/http';
import { lowerCaseEqual } from 'lib/utilities/strings';
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

const cachedTime = 60 * 60 * 1000; // 1 hour

async function getGitcoinPassportScores(wallets: string[]) {
  const scoreItems = await Promise.all(
    wallets.map(async (wallet) => {
      const registryScore = await http
        .GET<ScoreItem>(`${GITCOIN_SCORER_BASE_URL}/registry/score/${GITCOIN_SCORER_ID}/${wallet}`, undefined, {
          credentials: 'omit',
          headers: GITCOIN_API_HEADERS
        })
        .catch(() => {
          log.error('Error getting Gitcoin Passport scores from score registry', {
            wallet
          });
          return null;
        });

      const currentTime = new Date().getTime();

      if (registryScore && currentTime - new Date(registryScore.last_score_timestamp).getTime() < cachedTime) {
        return registryScore;
      }

      const passportScore = await http
        .POST<ScoreItem>(
          `${GITCOIN_SCORER_BASE_URL}/registry/submit-passport`,
          {
            address: wallet,
            scorer_id: GITCOIN_SCORER_ID
          },
          {
            credentials: 'omit',
            headers: GITCOIN_API_HEADERS
          }
        )
        .catch(() => {
          log.error('Error submitting wallet for passport score', {
            wallet
          });
          return null;
        });
      return passportScore;
    })
  );

  return scoreItems.filter(isTruthy);
}

export async function getGitcoinCredentialsByWallets({
  wallets
}: {
  wallets: string[];
}): Promise<EASAttestationFromApi[]> {
  const gitcoinPassportScores = await getGitcoinPassportScores(wallets);

  return wallets
    .map((wallet) => {
      const gitcoinPassportScore = gitcoinPassportScores.find((score) => lowerCaseEqual(score.address, wallet));
      if (!gitcoinPassportScore) {
        return null;
      }

      const mappedData: EASAttestationFromApi = {
        id: `${wallet}-gitcoin-passport-score`,
        content: {
          passport_score: Number(gitcoinPassportScore.score)
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
