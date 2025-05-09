import type { ReactNode } from 'react';

import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { RewardBlocksProvider } from 'components/rewards/hooks/useRewardBlocks';
import { RewardsBoardProvider } from 'components/rewards/hooks/useRewardsBoardAndBlocks';
import { DatabaseViewsProvider } from 'hooks/useDatabaseViews';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';

export function LayoutProviders({ children }: { children: ReactNode }) {
  return (
    <DatabaseViewsProvider>
      <ProposalBlocksProvider>
        <RewardBlocksProvider>
          <RewardsBoardProvider>
            <DocumentPageProviders>
              <PageDialogProvider>{children}</PageDialogProvider>
            </DocumentPageProviders>
          </RewardsBoardProvider>
        </RewardBlocksProvider>
      </ProposalBlocksProvider>
    </DatabaseViewsProvider>
  );
}
