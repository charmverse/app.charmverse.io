import { KeyboardArrowDown } from '@mui/icons-material';
import { ButtonGroup } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef } from 'react';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
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
  }

  function closeDialog() {
    clearRewardValues();
    clearNewPage();
  }

  function createNewReward() {
    clearRewardValues();
    openNewPage({
      type: 'bounty'
    });
  }

  async function saveForm() {
    const newReward = await createReward(newPageValues);
    if (newReward) {
      closeDialog();
    }
  }

  function createRewardFromTemplate(templateId: string) {
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
  let disabledTooltip: string | undefined;

  if (!newPageValues?.title) {
    disabledTooltip = 'Page title is required';
  } else if (!rewardValues.reviewers?.length) {
    disabledTooltip = 'Reviewer is required';
  } else if (
    !rewardValues.customReward &&
    (!rewardValues.rewardToken || !rewardValues.rewardAmount || !rewardValues.chainId)
  ) {
    disabledTooltip = 'Reward is required';
  }

  return (
    <>
      <ButtonGroup variant='contained' ref={buttonRef}>
        <Button data-test='create-suggest-bounty' onClick={createNewReward}>
          Create
        </Button>
        <Button data-test='reward-template-select' size='small' onClick={popupState.open}>
          <KeyboardArrowDown />
        </Button>
      </ButtonGroup>
      <TemplatesMenu
        isLoading={isLoading}
        pages={templates?.map((tpl) => tpl.page) ?? []}
        addPageFromTemplate={createRewardFromTemplate}
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
        disabledTooltip={disabledTooltip}
        isOpen={!!newPageValues}
        onClose={closeDialog}
        onSave={saveForm}
        isSaving={isSavingReward}
      >
        <NewDocumentPage titlePlaceholder='Title (required)' values={newPageValues} onChange={updateNewPageValues}>
          <RewardPropertiesForm onChange={setRewardValues} values={rewardValues} isNewReward expandedByDefault />
        </NewDocumentPage>
      </NewPageDialog>
    </>
  );
}
