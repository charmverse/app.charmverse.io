import { Box } from '@mui/material';
import { rest } from 'msw';
import { useState } from 'react';
import { withCharmEditorProviders } from 'stories/CharmEditor/renderEditor';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { ProposalRewardsTable } from 'components/proposals/ProposalPage/components/ProposalProperties/components/ProposalRewards/ProposalRewardsTable';
import type { ProposalPendingReward } from 'lib/proposal/interface';
import { createMockPage } from 'testing/mocks/page';
import { createMockProposal } from 'testing/mocks/proposal';
import { builders as _, jsonDoc } from 'testing/prosemirror/builders';

import { members } from '../lib/mockData';

import { withProposalProviders } from './components/ProposalsPageStory';

export default {
  title: 'Proposals/Components',
  component: ProposalRewards,
  decorators: [withProposalProviders, withCharmEditorProviders]
};

export function ProposalRewards() {
  const [pendingRewards, setPendingRewards] = useState<ProposalPendingReward[]>([]);
  const page = createMockPage({
    title: 'A simple proposition',
    type: 'proposal',
    content: jsonDoc(_.p('This is the content')),
    proposalId: 'a proposal id'
  });

  return (
    <GlobalContext>
      <ProposalRewardsTable
        pendingRewards={pendingRewards}
        reviewers={[]}
        assignedSubmitters={[]}
        variant='solid_button'
        isProposalTemplate={true}
        rewardIds={[]}
        onSave={(pendingReward) => {
          const isExisting = pendingRewards.find((reward) => reward.draftId === pendingReward.draftId);
          if (!isExisting) {
            setPendingRewards([...pendingRewards, pendingReward]);
          } else {
            setPendingRewards(
              pendingRewards.map((draft) => {
                if (draft.draftId === pendingReward.draftId) {
                  return pendingReward;
                }
                return draft;
              })
            );
          }
        }}
        onDelete={(draftId: string) => {
          setPendingRewards(pendingRewards.filter((draft) => draft.draftId !== draftId));
        }}
      />
    </GlobalContext>
  );
}

ProposalRewards.parameters = {
  msw: {
    handlers: {
      msw: {
        handlers: {
          proposals: rest.get('/api/spaces/:spaceId/proposals', (req, res, ctx) => {
            return res(ctx.json([]));
          }),
          getProposalBlocks: rest.get('/api/spaces/:spaceId/proposals/blocks', (req, res, ctx) => {
            return res(ctx.json([]));
          }),
          pages: rest.get('/api/spaces/:spaceId/pages', (req, res, ctx) => {
            return res(ctx.json([]));
          })
        }
      },
      proposal: rest.get('/api/proposals/:proposalId', (req, res, ctx) => {
        const proposal = createMockProposal({
          authors: [{ proposalId: '', userId: members[0].id }],
          status: 'published'
        });
        return res(ctx.json(proposal));
      })
    }
  }
};
