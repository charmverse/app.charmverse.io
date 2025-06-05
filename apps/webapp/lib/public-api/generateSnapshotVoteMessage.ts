import { getCurrentDate } from '@packages/lib/utils/dates';
import type { Vote } from '@snapshot-labs/snapshot.js/src/sign/types';
import { getAddress } from 'viem';

import type { SnapshotProposalVoteMessage, SnapshotProposalVoteType } from './interfaces';

const NAME = 'snapshot';
const VERSION = '0.1.4';

export const domain = {
  name: NAME,
  version: VERSION
};

export const voteTypes = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'string' },
    { name: 'choice', type: 'uint32' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const voteArrayTypes = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'string' },
    { name: 'choice', type: 'uint32[]' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const voteStringTypes = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'string' },
    { name: 'choice', type: 'string' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const vote2Types = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' },
    { name: 'choice', type: 'uint32' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const voteArray2Types = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' },
    { name: 'choice', type: 'uint32[]' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

export const voteString2Types = {
  Vote: [
    { name: 'from', type: 'address' },
    { name: 'space', type: 'string' },
    { name: 'timestamp', type: 'uint64' },
    { name: 'proposal', type: 'bytes32' },
    { name: 'choice', type: 'string' },
    { name: 'reason', type: 'string' },
    { name: 'app', type: 'string' },
    { name: 'metadata', type: 'string' }
  ]
};

// reference: https://github.com/snapshot-labs/snapshot.js/blob/350a1efa523efae9e984aeb376ff92f582965c5f/src/sign/index.ts#L148
export function generateSnapshotVoteMessage({ message, address }: { message: Vote; address: string }): {
  message: SnapshotProposalVoteMessage;
  types: SnapshotProposalVoteType;
  domain: { name: string; version: string };
} {
  const checksumAddress = getAddress(address);
  message.from = message.from ? getAddress(message.from) : checksumAddress;
  if (!message.timestamp) message.timestamp = parseInt((getCurrentDate().getTime() / 1e3).toFixed());
  const isShutter = message?.privacy === 'shutter';
  if (!message.reason) message.reason = '';
  if (!message.app) message.app = '';
  if (!message.metadata) message.metadata = '{}';
  const type2 = message.proposal.startsWith('0x');
  let types = type2 ? vote2Types : voteTypes;
  if (['approval', 'ranked-choice'].includes(message.type)) types = type2 ? voteArray2Types : voteArrayTypes;
  if (!isShutter && ['quadratic', 'weighted'].includes(message.type)) {
    types = type2 ? voteString2Types : voteStringTypes;
    message.choice = JSON.stringify(message.choice);
  }
  if (isShutter) types = type2 ? voteString2Types : voteStringTypes;
  delete message.privacy;
  // @ts-ignore
  delete message.type;
  return {
    message: message as SnapshotProposalVoteMessage,
    types,
    domain
  };
}
