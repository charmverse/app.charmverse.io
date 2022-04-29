import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';

import snapshot from '@snapshot-labs/snapshot.js';
import ListItemText from '@mui/material/ListItemText';
import { useState } from 'react';
import { generateMarkdown } from 'lib/pages/generateMarkdown';
import { Page } from '@prisma/client';

const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
const client = new snapshot.Client712(hub);

export default function PublishToSnapshot ({ page }: {page: Page}) {
  const { account, library, chainId } = useWeb3React();

  const [proposal, setProposal] = useState(null);

  async function publish () {
    if (account) {

      const content = generateMarkdown(page, false);

      const receipt = await client.proposal(library, account, {
        space: 'melboudi.eth',
        type: 'single-choice',
        title: page.title,
        body: content,
        choices: ['Yay', 'Neigh'],
        start: 1651258800,
        end: 1651518000,
        snapshot: 14675352,
        network: '4',
        strategies: JSON.stringify([{ name: 'ticket', network: '4', params: {} }]),
        plugins: JSON.stringify({}),
        metadata: JSON.stringify({})
      });

      console.log('Receipt', receipt);
    }
  }

  return (
    <ListItemText onClick={publish} primary='Publish to snapshot' />
  );
}
