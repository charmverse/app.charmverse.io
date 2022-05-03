import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import IosShareIcon from '@mui/icons-material/IosShare';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Page } from '@prisma/client';
import snapshot from '@snapshot-labs/snapshot.js';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import Link from 'components/common/Link';
import { LoadingIcon } from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { generateMarkdown } from 'lib/pages/generateMarkdown';
import { getSnapshotProposal, SnapshotProposal, SnapshotReceipt } from 'lib/snapshot';
import { useEffect, useState } from 'react';

const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
const client = new snapshot.Client712(hub);

export default function PublishToSnapshot ({ page }: {page: Page}) {
  const { account, library } = useWeb3React();

  const [space] = useCurrentSpace();

  const [checkingProposal, setCheckingProposal] = useState(!!page.snapshotProposalId);
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const { pages, setPages } = usePages();

  async function verifyProposal (proposalId: string) {
    const snapshotProposal = await getSnapshotProposal(proposalId);

    setProposal(snapshotProposal);
    setCheckingProposal(false);
  }

  useEffect(() => {
    if (page?.snapshotProposalId) {
      verifyProposal(page?.snapshotProposalId);
    }
    else {
      setProposal(null);
    }

  }, [page, page?.snapshotProposalId]);

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
    <ListItemButton>

      {

      checkingProposal && (
        <>
          <LoadingIcon size={18} sx={{ mr: 1 }} />
          <ListItemText primary='Checking proposal' />
          {
          /**
           *   <LoadingComponent>
            <ListItemText primary='Checking proposal' />
          </LoadingComponent>

           */
        }

        </>
      )
      }

      {
        !checkingProposal && !proposal && (
          <>
            <IosShareIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText onClick={publish} primary='Publish to snapshot' />
          </>
        )
      }

      {
      !checkingProposal && proposal && (
      <Link sx={{ display: 'inline-block' }} external target='_blank' href={`https://snapshot.org/#/${proposal.space.id}/proposal/${proposal.id}`}>
        <ExitToAppIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='View on Snapshot' />
      </Link>
      )
      }

    </ListItemButton>

  );
}
