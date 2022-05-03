import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';

import snapshot from '@snapshot-labs/snapshot.js';
import ListItemText from '@mui/material/ListItemText';
import { useState } from 'react';
import { generateMarkdown } from 'lib/pages/generateMarkdown';
import { Page } from '@prisma/client';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import charmClient from 'charmClient';
import { SnapshotReceipt } from 'lib/snapshot/interfaces';

const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
const client = new snapshot.Client712(hub);

export default function PublishToSnapshot ({ page }: {page: Page}) {
  const { account, library, chainId } = useWeb3React();

  const [space] = useCurrentSpace();

  const [proposal, setProposal] = useState(null);

  const { pages, setPages } = usePages();

  const startDate = Math.round((Date.now() / 1000) + 3600);
  const endDate = Math.round((Date.now() / 1000) + 3600 * 24 * (space?.defaultVotingDuration ?? 0));

  async function publish () {
    if (account) {

      const content = generateMarkdown(page, false);

      const currentBlockNum = await library.getBlockNumber();

      const receipt = await client.proposal(library, account, {
        space: space?.snapshotDomain as any,
        type: 'single-choice',
        title: page.title,
        body: content,
        choices: ['Yay', 'Neigh'],
        start: startDate,
        end: endDate,
        snapshot: 0,
        network: '4',
        strategies: JSON.stringify([{ name: 'ticket', network: '4', params: {} }]),
        plugins: JSON.stringify({}),
        metadata: JSON.stringify({})
      }) as SnapshotReceipt;

      const updatedPage = await charmClient.updatePageSnapshotData(page.id, {
        snapshotProposalDomain: space?.snapshotDomain as any,
        snapshotProposalId: receipt.id
      });

      console.log('Receipt', receipt);
      setPages({
        ...pages,
        [page.id]: updatedPage
      });

    }
  }

  async function getBlock () {

  }

  return (
    <ListItemText onClick={publish} primary='Publish to snapshot' />
  );
}
