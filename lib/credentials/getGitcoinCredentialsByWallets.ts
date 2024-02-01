import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import * as http from 'adapters/http';
import { lowerCaseEqual } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';

import type { EASAttestationWithFavorite } from './external/getOnchainCredentials';

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

async function getGitcoinPassportScores(wallets: string[]) {
  try {
    const scoreItems = await Promise.all(
      wallets.map(async (wallet) => {
        try {
          let score = await http.GET<ScoreItem>(
            `${GITCOIN_SCORER_BASE_URL}/registry/score/${GITCOIN_SCORER_ID}/${wallet}`,
            undefined,
            {
              credentials: 'omit',
              headers: GITCOIN_API_HEADERS
            }
          );

          if (!score) {
            score = await http.POST<ScoreItem>(
              `${GITCOIN_SCORER_BASE_URL}/registry/submit-passport`,
              {
                address: wallet,
                scorer_id: GITCOIN_SCORER_ID
              },
              {
                credentials: 'omit',
                headers: GITCOIN_API_HEADERS
              }
            );
          }

          return score;
        } catch (_) {
          return null;
        }
      })
    );

    return scoreItems.filter(isTruthy);
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
}): Promise<EASAttestationWithFavorite[]> {
  const gitcoinPassportScores = await getGitcoinPassportScores(wallets);
  const favoriteCredentials = await prisma.favoriteCredential.findMany({
    where: {
      gitcoinWalletAddress: {
        in: wallets
      }
    },
    select: {
      id: true,
      index: true,
      gitcoinWalletAddress: true
    }
  });

  return wallets
    .map((wallet) => {
      const favoriteCredential = favoriteCredentials.find((f) => lowerCaseEqual(f.gitcoinWalletAddress, wallet));
      const gitcoinPassportScore = gitcoinPassportScores.find((score) => lowerCaseEqual(score.address, wallet));
      if (!gitcoinPassportScore) {
        return null;
      }

      const mappedData: EASAttestationWithFavorite = {
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
        iconUrl: null,
        favoriteCredentialId: favoriteCredential?.id ?? null,
        index: favoriteCredential?.index ?? -1
      };

      return mappedData;
    })
    .filter(isTruthy);
}
