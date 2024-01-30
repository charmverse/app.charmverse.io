import { log } from '@charmverse/core/log';

import * as http from 'adapters/http';

import type { EASAttestationFromApi } from './external/getExternalCredentials';

type CredentialSubject = {
  id: string;
  hash: string;
  '@context': { hash: string; provider: string }[];
  provider: string;
};

type Proof = {
  jws: string;
  type: string;
  created: string;
  proofPurpose: string;
  verificationMethod: string;
};

type Credential = {
  type: string[];
  proof: Proof;
  issuer: string;
  '@context': string[];
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: CredentialSubject;
};

type Platform = {
  id: string;
  icon: string;
  name: string;
  description: string;
  connectMessage: string;
};

type Metadata = {
  group: string;
  platform: Platform;
  name: string;
  description: string;
  hash: string;
};

export type GitcoinStamp = {
  version: string;
  credential: Credential;
  metadata: Metadata;
};

type GetAddressGitcoinStampResponse = {
  next: string | null;
  prev: string | null;
  items: GitcoinStamp[];
};

const GITCOIN_SCORER_BASE_URL = 'https://api.scorer.gitcoin.co';

const GITCOIN_API_HEADERS = {
  'Content-Type': 'application/json',
  'X-Api-Key': process.env.GITCOIN_API_KEY
};

const GITCOIN_SCORER_ID = 6441;

async function getAddressGitcoinStamps({ wallet }: { wallet: string }) {
  const response = await http.GET<GetAddressGitcoinStampResponse>(
    `${GITCOIN_SCORER_BASE_URL}/registry/stamps/${wallet}`,
    {
      include_metadata: true
    },
    {
      credentials: 'omit',
      headers: GITCOIN_API_HEADERS
    }
  );

  return response.items.map((stamp) => ({
    ...stamp,
    recipient: wallet
  }));
}

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
  evidence: Evidence;
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
        addresses: wallets.join(',')
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
  const gitcoinStamps = (await Promise.all(wallets.map((wallet) => getAddressGitcoinStamps({ wallet }).then()))).flat();
  const gitcoinPassportScores = await getGitcoinPassportScores(wallets);
  return gitcoinStamps.map((stamp) => {
    const gitcoinPassportScore = gitcoinPassportScores.find((score) => score.address === stamp.recipient);

    const mappedData: EASAttestationFromApi = {
      id: stamp.metadata.platform.id, // This is not the stamp id, the api doesn't return the stamp id
      content: {
        title: 'Gitcoin Passport',
        organization: 'Gitcoin',
        fields: gitcoinPassportScore ? [{ name: 'passport_score' }] : [],
        passport_score: gitcoinPassportScore ? `Passport Score: ${gitcoinPassportScore.evidence.rawScore}` : null
      },
      attester: stamp.credential.issuer, // This is in did:key:{publicKey} format not a address
      recipient: stamp.recipient,
      schemaId: '0xd7b8c4ffa4c9fd1ecb3f6db8201e916a8d7dba11f161c1b0b5ccf44ceb8e2a39', // Optimism attestation schema id: https://docs.passport.gitcoin.co/building-with-passport/smart-contracts/contract-reference#eas-schema,
      timeCreated: new Date(stamp.credential.issuanceDate).getTime(),
      chainId: null, // Optimism or Linea chain id
      type: 'external',
      verificationUrl: null,
      iconUrl: `/images/logos/Gitcoin_Passport_Logomark_SeaFoam.svg`
    };

    return mappedData;
  });
}
