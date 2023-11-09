import { KeyboardArrowDown } from '@mui/icons-material';
import { ButtonGroup } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { NewPageDocument } from 'components/common/PageDialog/components/NewPageDocument';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { TemplatesMenu } from 'components/common/TemplatesMenu';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useIsAdmin } from 'hooks/useIsAdmin';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { useRewardTemplates } from '../hooks/useRewardTemplates';

export function NewRewardButton({ showPage }: { showPage: (pageId: string) => void }) {
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();

  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, createReward, isSavingReward } =
    useNewReward();
  const isAdmin = useIsAdmin();
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });
  const { templates, isLoading } = useRewardTemplates();

  function deleteTemplate(pageId: string) {
    return charmClient.deletePage(pageId);
  }

  function createTemplate() {
    openNewPage({
      type: 'bounty_template'
    });
    popupState.close();
  }

  function resetForm() {
    clearRewardValues();
    clearNewPage();
  }

  function createProposal() {
    clearRewardValues();
    openNewPage({
      type: 'proposal'
    });
  }

  async function saveForm() {
    const newReward = await createReward(newPageValues);
    if (newReward) {
      resetForm();
    }
  }

  function createProposalFromTemplate(templateId: string) {
    const template = templates?.find((tpl) => tpl.page.id === templateId);
    if (template) {
      openNewPage({
        ...template.page,
        content: template.page.content as PageContent,
        type: 'bounty'
      });
      setRewardValues(template.reward);
    } else {
      throw new Error('Reward template not found');
    }
  }
  return (
    <>
      <ButtonGroup variant='contained' ref={buttonRef}>
        <Button data-test='create-suggest-bounty' onClick={createProposal}>
          Create
        </Button>
        <Button data-test='reward-template-select' size='small' onClick={popupState.open}>
          <KeyboardArrowDown />
        </Button>
      </ButtonGroup>
      <TemplatesMenu
        isLoading={isLoading}
        pages={templates?.map((tpl) => tpl.page) ?? []}
        addPageFromTemplate={createProposalFromTemplate}
        createTemplate={createTemplate}
        editTemplate={(pageId) => showPage(pageId)}
        deleteTemplate={deleteTemplate}
        anchorEl={buttonRef.current as Element}
        boardTitle='Rewards'
        popupState={popupState}
        enableItemOptions={isAdmin}
        enableNewTemplates={isAdmin}
      />

      <NewPageDialog
        contentUpdated={contentUpdated || isDirty}
        isOpen={!!newPageValues}
        onClose={resetForm}
        onSave={saveForm}
        isSaving={isSavingReward}
      >
        <NewPageDocument readOnly={false} values={newPageValues} onChange={updateNewPageValues}>
          <RewardPropertiesForm onChange={setRewardValues} values={rewardValues} />
        </NewPageDocument>
      </NewPageDialog>
    </>
  );
}
