import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import type { Page } from '@prisma/client';
import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { DownIcon } from 'components/common/Icons/DownIcon';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { TemplatesMenu } from 'components/common/TemplatesMenu';
import useTasks from 'components/nexus/hooks/useTasks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { addPage } from 'lib/pages/addPage';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef, useState } from 'react';
import type { KeyedMutator } from 'swr';

export default function NewProposalButton ({ mutateProposals }: {mutateProposals: KeyedMutator<ProposalWithUsers[]>}) {
  const { user } = useUser();
  const [currentSpace] = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const { showPage } = usePageDialog();
  const isAdmin = useIsAdmin();
  const { setPages, pages } = usePages();
  const { mutate } = useTasks();

  // MUI Menu specific content
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });

  const [proposalTemplates, setProposalTemplates] = useState<Page[]>([]);

  useEffect(() => {
    if (pages) {
      setProposalTemplates(Object.values(pages).filter(p => p?.type === 'proposal_template') as Page[]);
    }

  }, [pages]);

  const canCreateProposal = !!userSpacePermissions?.createVote;

  async function deleteProposalTemplate (templateId: string) {
    await charmClient.deletePage(templateId);
    setProposalTemplates(proposalTemplates.filter(p => p.id !== templateId));

    setPages(_pages => {
      delete _pages[templateId];
      return _pages;
    });
  }

  async function createProposalFromTemplate (templateId: string) {
    if (currentSpace) {
      const newProposal = await charmClient.proposals.createProposalFromTemplate({
        spaceId: currentSpace.id,
        templateId
      });

      mutateProposals();

      setPages(_pages => {
        _pages[newProposal.id] = newProposal;
        return _pages;
      });

      showPage({
        pageId: newProposal.id
      });
    }
  }

  async function createProposalTemplate () {
    if (currentSpace) {
      const newTemplate = await charmClient.proposals.createProposalTemplate({ spaceId: currentSpace.id });

      setPages(_pages => ({
        ..._pages,
        [newTemplate.id]: newTemplate
      }));
      showPage({
        pageId: newTemplate.id
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

      setPages(_pages => ({
        ..._pages,
        [newPage.id]: newPage
      }));

      mutateProposals();
      mutate();
      showPage({
        pageId: newPage.id,
        onClose () {
          mutateProposals();
        }
      });
    }
  }

  return (

    <>

      <Tooltip title={!canCreateProposal ? 'You do not have the permission to create a proposal.' : ''}>
        <Box>
          <Button disabled={!canCreateProposal} ref={buttonRef}>
            <Box
              onClick={onClickCreate}
            >
              Create Proposal
            </Box>

            <Box
            // Negative right margin fixes issue with too much whitespace on right of button
              sx={{ pl: 1, mr: -2 }}
              {...bindTrigger(popupState)}
            >
              <DownIcon />
            </Box>
          </Button>
        </Box>
      </Tooltip>
      <TemplatesMenu
        addPageFromTemplate={createProposalFromTemplate}
        createTemplate={createProposalTemplate}
        editTemplate={(pageId) => showPage({ pageId })}
        deleteTemplate={deleteProposalTemplate}
        pages={proposalTemplates}
        anchorEl={buttonRef.current as Element}
        boardTitle='Proposals'
        popupState={popupState}
        enableItemOptions={isAdmin}
      />
    </>
  );
}
