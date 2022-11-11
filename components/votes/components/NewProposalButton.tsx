import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, ButtonGroup, Tooltip } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { TemplatesMenu } from 'components/common/TemplatesMenu';
import useTasks from 'components/nexus/hooks/useTasks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import type { PageMeta } from 'lib/pages';
import { addPage } from 'lib/pages/addPage';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

export default function NewProposalButton ({ mutateProposals }: { mutateProposals: KeyedMutator<ProposalWithUsers[]> }) {
  const router = useRouter();
  const { user } = useUser();
  const currentSpace = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const { showPage } = usePageDialog();
  const isAdmin = useIsAdmin();
  const { mutatePagesRemove, mutatePage, pages } = usePages();
  const { mutate } = useTasks();

  // MUI Menu specific content
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });

  const [proposalTemplates, setProposalTemplates] = useState<PageMeta[]>([]);

  useEffect(() => {
    if (pages) {
      setProposalTemplates(Object.values(pages).filter(p => p?.type === 'proposal_template') as PageMeta[]);
    }

  }, [pages]);

  const canCreateProposal = !!userSpacePermissions?.createVote;

  async function deleteProposalTemplate (templateId: string) {
    await charmClient.deletePage(templateId);
    setProposalTemplates(proposalTemplates.filter(p => p.id !== templateId));

    mutatePagesRemove([templateId]);
  }

  async function createProposalFromTemplate (templateId: string) {
    if (currentSpace) {
      const newProposal = await charmClient.proposals.createProposalFromTemplate({
        spaceId: currentSpace.id,
        templateId
      });

      mutateProposals();
      mutatePage(newProposal);
      setUrlWithoutRerender(router.pathname, { id: newProposal.id });
      showPage({
        pageId: newProposal.id,
        onClose () {
          setUrlWithoutRerender(router.pathname, { id: null });
        }
      });
    }
  }

  async function createProposalTemplate () {
    if (currentSpace) {
      const newTemplate = await charmClient.proposals.createProposalTemplate({ spaceId: currentSpace.id });

      mutatePage(newTemplate);
      setUrlWithoutRerender(router.pathname, { id: newTemplate.id });
      showPage({
        pageId: newTemplate.id,
        onClose () {
          setUrlWithoutRerender(router.pathname, { id: null });
        }
      });
    }
  }

  async function onClickCreate () {
    if (currentSpace && user) {
      const { page: newPage } = await addPage({
        spaceId: currentSpace.id,
        createdBy: user.id,
        type: 'proposal'
      });

      mutatePage(newPage);

      mutateProposals();
      mutate();
      showPage({
        pageId: newPage.id,
        onClose () {
          setUrlWithoutRerender(router.pathname, { id: null });
          mutateProposals();
        }
      });
      setUrlWithoutRerender(router.pathname, { id: newPage.id });
    }
  }

  return (

    <>
      <Tooltip title={!canCreateProposal ? 'You do not have the permission to create a proposal.' : ''}>
        <Box>
          <ButtonGroup variant='contained' ref={buttonRef}>
            <Button disabled={!canCreateProposal} onClick={onClickCreate}>
              Create Proposal
            </Button>
            <Button size='small' disabled={!canCreateProposal} onClick={popupState.open}>
              <KeyboardArrowDown />
            </Button>
          </ButtonGroup>
        </Box>
      </Tooltip>
      <TemplatesMenu
        addPageFromTemplate={createProposalFromTemplate}
        createTemplate={createProposalTemplate}
        editTemplate={(pageId) => {
          setUrlWithoutRerender(router.pathname, { id: pageId });
          showPage({ pageId,
            onClose () {
              setUrlWithoutRerender(router.pathname, { id: null });
            } });
        }}
        deleteTemplate={deleteProposalTemplate}
        pages={proposalTemplates}
        anchorEl={buttonRef.current as Element}
        boardTitle='Proposals'
        popupState={popupState}
        enableItemOptions={isAdmin}
        enableNewTemplates={isAdmin}
      />
    </>
  );
}
