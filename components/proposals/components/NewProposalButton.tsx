import styled from '@emotion/styled';
import { KeyboardArrowDown } from '@mui/icons-material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import { Box, ButtonGroup, MenuItem, Stack, Tooltip, Typography, ListItemIcon, ListItemText } from '@mui/material';
import { getAbsolutePath } from '@root/lib/utils/browser';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useRef } from 'react';

import charmClient from 'charmClient/charmClient';
import { useTrashPages } from 'charmClient/hooks/pages';
import { useGetProposalWorkflows } from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import { DeleteIcon } from 'components/common/Icons/DeleteIcon';
import { EditIcon } from 'components/common/Icons/EditIcon';
import Modal from 'components/common/Modal';
import { ArchiveProposalAction } from 'components/common/PageActions/components/ArchiveProposalAction';
import { CopyPageLinkAction } from 'components/common/PageActions/components/CopyPageLinkAction';
import { PublishProposalAction } from 'components/common/PageActions/components/PublishProposalAction';
import { TemplatesMenu } from 'components/common/TemplatesMenu/TemplatesMenu';
import type { TemplateItem } from 'components/common/TemplatesMenu/TemplatesMenu';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalContentType } from 'lib/proposals/createDraftProposal';

import { useProposalTemplates } from '../hooks/useProposalTemplates';

const ProposalTemplateMenu = styled(Stack)`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  padding: ${({ theme }) => theme.spacing(2)};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  &:hover {
    background-color: ${({ theme }) => theme.palette.background.light};
    transition: background-color 0.2s ease-in-out;
  }
  gap: ${({ theme }) => theme.spacing(1)};
  flex-direction: row;
  align-items: center;
`;

export function NewProposalButton() {
  const { navigateToSpacePath } = useCharmRouter();
  const { getFeatureTitle } = useSpaceFeatures();
  const [spacePermissions] = useCurrentSpacePermissions();
  const isAdmin = useIsAdmin();
  const proposalTemplateCreateModalState = usePopupState({ variant: 'dialog' });
  // MUI Menu specific content
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });
  const { proposalTemplates, isLoadingTemplates } = useProposalTemplates();
  const { trigger: trashPages } = useTrashPages();
  const canCreateProposal = spacePermissions?.createProposals;

  const { space } = useCurrentSpace();
  const { data: workflows } = useGetProposalWorkflows(space?.id);

  const templatesRequired = !!space?.requireProposalTemplate;

  const hasWorkflows = !!workflows?.length;

  const proposalTemplatePages: TemplateItem[] = (proposalTemplates || []).map((proposal) => ({
    id: proposal.pageId,
    title: proposal.title,
    proposalId: proposal.proposalId,
    isStructuredProposal: proposal.contentType === 'structured',
    archived: !!proposal.archived,
    draft: proposal.draft
  }));

  function deleteProposalTemplate(pageId: string) {
    return trashPages({ pageIds: [pageId], trash: true });
  }

  function editTemplate(pageId: string) {
    navigateToSpacePath(`/${pageId}`);
  }

  function createTemplate(contentType: ProposalContentType) {
    navigateToSpacePath('/proposals/new', { type: 'proposal_template', contentType });
  }

  function createFromTemplate(template: TemplateItem) {
    if (space?.domain === 'op-grants') {
      charmClient.track.trackActionOp('click_proposal_creation_button', {
        spaceId: space.id
      });
    }
    navigateToSpacePath(`/proposals/new`, { template: template.id });
  }

  function duplicateTemplate(pageId: string) {
    navigateToSpacePath(`/proposals/new`, { type: 'proposal_template', template: pageId });
  }

  return (
    <>
      <Tooltip
        title={
          !canCreateProposal
            ? 'You do not have the permission to create a proposal.'
            : !hasWorkflows
              ? 'Add a workflow from the space settings to start using proposals'
              : ''
        }
      >
        <Box>
          <ButtonGroup variant='contained' ref={buttonRef}>
            <Button
              disabled={!canCreateProposal || !hasWorkflows}
              onClick={() => {
                if (space?.domain === 'op-grants') {
                  charmClient.track.trackActionOp('click_proposal_creation_button', {
                    spaceId: space.id
                  });
                }
                if (templatesRequired) {
                  popupState.open();
                }
              }}
              // We don't want to navigate to the new proposal page if the space enforces creating templates from a proposal
              href={templatesRequired ? undefined : '/proposals/new'}
              data-test='new-proposal-button'
            >
              Create
            </Button>
            <Button
              data-test='proposal-template-select'
              size='small'
              disabled={!canCreateProposal || !hasWorkflows}
              onClick={() => {
                if (space?.domain === 'op-grants') {
                  charmClient.track.trackActionOp('click_proposal_creation_button', {
                    spaceId: space.id
                  });
                }
                popupState.open();
              }}
            >
              <KeyboardArrowDown />
            </Button>
          </ButtonGroup>
        </Box>
      </Tooltip>
      <TemplatesMenu
        isLoading={isLoadingTemplates}
        addPageFromTemplate={createFromTemplate}
        editTemplate={editTemplate}
        templates={proposalTemplatePages}
        createTemplate={proposalTemplateCreateModalState.open}
        deleteTemplate={deleteProposalTemplate}
        anchorEl={buttonRef.current as Element}
        boardTitle={getFeatureTitle('Proposals')}
        popupState={popupState}
        enableItemOptions={isAdmin}
        enableNewTemplates={isAdmin}
        // eslint-disable-next-line react/no-unstable-nested-components
        pageActions={({ pageId, proposalId }) => (
          <>
            <MenuItem
              data-test={`template-menu-edit-${pageId}`}
              onClick={() => {
                editTemplate(pageId);
              }}
            >
              <ListItemIcon>
                <EditIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <CopyPageLinkAction
              path={`/proposals/new?template=${pageId}`}
              message='Link copied. NOTE: anyone can join your space using this link.'
            />

            <MenuItem
              data-test='duplicate-template-button'
              onClick={() => {
                duplicateTemplate(pageId);
              }}
            >
              <ListItemIcon>
                <FileCopyOutlinedIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText>Duplicate</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={(e) => {
                deleteProposalTemplate(pageId);
              }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
            <span onClick={(e) => e.stopPropagation()}>
              <ArchiveProposalAction proposalId={proposalId!} />
            </span>
            <span onClick={(e) => e.stopPropagation()}>
              <PublishProposalAction proposalId={proposalId!} />
            </span>
          </>
        )}
      />

      <Modal
        title='Select a template type'
        open={proposalTemplateCreateModalState.isOpen}
        onClose={proposalTemplateCreateModalState.close}
      >
        <Stack spacing={2}>
          <ProposalTemplateMenu
            onClick={() => createTemplate('structured')}
            data-test='structured-proposal-template-menu'
          >
            <WidgetsOutlinedIcon fontSize='large' />
            <Typography variant='h6'>Form</Typography>
          </ProposalTemplateMenu>
          <ProposalTemplateMenu
            onClick={() => createTemplate('free_form')}
            data-test='free_form-proposal-template-menu'
          >
            <DescriptionOutlinedIcon fontSize='large' />
            <Typography variant='h6'>Document</Typography>
          </ProposalTemplateMenu>
        </Stack>
      </Modal>
    </>
  );
}
