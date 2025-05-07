import { Box, Paper } from '@mui/material';
import { createMockPage } from '@packages/testing/mocks/page';
import { createMockProposal } from '@packages/testing/mocks/proposal';
import { http, HttpResponse } from 'msw';
import { useRef, useState } from 'react';
import { withCharmEditorProviders } from 'stories/CharmEditor/renderEditor';
import { GlobalContext } from 'stories/lib/GlobalContext';
import { useResizeObserver } from 'usehooks-ts';

import { ProposalRewardsTable } from 'components/proposals/ProposalPage/components/ProposalProperties/components/ProposalRewards/ProposalRewardsTable';
import { RewardBlocksProvider } from 'components/rewards/hooks/useRewardBlocks';
import { RewardsBoardProvider } from 'components/rewards/hooks/useRewardsBoardAndBlocks';
import type { ProposalPendingReward } from '@packages/lib/proposals/interfaces';
import { builders as _, jsonDoc } from 'lib/prosemirror/builders';

import { members } from '../lib/mockData';

import { withProposalProviders } from './components/ProposalsPageStory';

export default {
  title: 'Proposals/Components',
  component: ProposalRewards,
  decorators: [withProposalProviders, withCharmEditorProviders]
};

export function ProposalRewards() {
  const containerWidthRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth = 0 } = useResizeObserver({ ref: containerWidthRef });
  const [pendingRewards, setPendingRewards] = useState<ProposalPendingReward[]>([]);
  const page = createMockPage({
    title: 'A simple proposition',
    type: 'proposal',
    content: jsonDoc(_.p('This is the content')),
    proposalId: 'a proposal id'
  });

  return (
    <GlobalContext>
      <RewardBlocksProvider>
        <RewardsBoardProvider>
          <Paper ref={containerWidthRef} sx={{ p: 4, maxWidth: 800, overflowY: 'auto' }}>
            <ProposalRewardsTable
              containerWidth={containerWidth}
              pendingRewards={pendingRewards}
              reviewers={[]}
              assignedSubmitters={[]}
              proposalCreatedAt={new Date()}
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
          </Paper>
        </RewardsBoardProvider>
      </RewardBlocksProvider>
    </GlobalContext>
  );
}

ProposalRewards.parameters = {
  msw: {
    handlers: {
      proposals: http.get('/api/spaces/:spaceId/proposals', () => {
        return HttpResponse.json([]);
      }),
      proposal: http.get('/api/proposals/:proposalId', () => {
        const proposal = createMockProposal({
          authors: [{ proposalId: '', userId: members[0].id }],
          status: 'published'
        });
        return HttpResponse.json(proposal);
      }),
      getProposalBlocks: http.get('/api/spaces/:spaceId/proposals/blocks', () => {
        return HttpResponse.json([]);
      }),
      pages: http.get('/api/spaces/:spaceId/pages', () => {
        return HttpResponse.json([]);
      })
    }
  }
};
