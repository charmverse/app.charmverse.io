import { useState } from 'react';

import { useUpdateProposalStatusOnly } from 'charmClient/hooks/proposals';
import { CreateLensPublication } from 'components/[pageId]/DocumentPage/components/CreateLensPublication';
import { Button } from 'components/common/Button';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PageWithContent } from 'lib/pages';
import type { ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { PageContent } from 'lib/prosemirror/interfaces';

export type Props = {
  proposal: ProposalWithUsersAndRubric;
  onSubmit?: VoidFunction;
  page: PageWithContent;
};

export function CompleteDraftButton({ page, proposal, onSubmit }: Props) {
  const { showMessage } = useSnackbar();
  const { trigger: updateProposalStatus, isMutating } = useUpdateProposalStatusOnly({ proposalId: proposal.id });
  const { setupLensProfile } = useLensProfile();
  const [isPublishingToLens, setIsPublishingToLens] = useState(false);

  async function onClick() {
    try {
      await updateProposalStatus({ newStatus: 'published' });
    } catch (error) {
      showMessage((error as Error).message, 'error');
    }
    if (proposal.publishToLens) {
      const lensProfileSetup = await setupLensProfile();
      if (lensProfileSetup) {
        setIsPublishingToLens(true);
      } else {
        onSubmit?.();
      }
    } else {
      onSubmit?.();
    }
  }

  return (
    <>
      <Button data-test='complete-draft-button' loading={isMutating} onClick={onClick}>
        Publish
      </Button>
      {isPublishingToLens && (
        <CreateLensPublication
          onError={() => {
            setIsPublishingToLens(false);
            onSubmit?.();
          }}
          publicationType='post'
          content={page.content as PageContent}
          proposalId={proposal.id}
          proposalPath={page.path}
          onSuccess={() => {
            setIsPublishingToLens(false);
            onSubmit?.();
          }}
          proposalTitle={page.title ?? 'Untitled'}
        />
      )}
    </>
  );
}
