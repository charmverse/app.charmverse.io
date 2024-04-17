import { KeyboardArrowDown } from '@mui/icons-material';
import { ButtonGroup } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { useTrashPages } from 'charmClient/hooks/pages';
import { Button } from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { NewDocumentPage } from 'components/common/PageDialog/components/NewDocumentPage';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';
import { NewPageDialog } from 'components/common/PageDialog/NewPageDialog';
import { TemplatesMenu } from 'components/common/TemplatesMenu/TemplatesMenu';
import { RewardPropertiesForm } from 'components/rewards/components/RewardProperties/RewardPropertiesForm';
import { useNewReward } from 'components/rewards/hooks/useNewReward';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { getRewardErrors } from 'lib/rewards/getRewardErrors';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import { getRewardType } from 'lib/rewards/getRewardType';

import { useRewardTemplates } from '../hooks/useRewardTemplates';

export function NewRewardButton({ showPage }: { showPage: (pageId: string) => void }) {
  const { isDirty, clearNewPage, openNewPage, newPageValues, updateNewPageValues } = useNewPage();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<RewardTemplate | null>(null);
  const overrideContentModalPopupState = usePopupState({ variant: 'popover', popupId: 'override-content' });
  const { clearRewardValues, contentUpdated, rewardValues, setRewardValues, createReward, isSavingReward } =
    useNewReward();
  const isAdmin = useIsAdmin();
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });
  const { templates, isLoading } = useRewardTemplates();
  const [currentSpacePermissions] = useCurrentSpacePermissions();
  const { getFeatureTitle } = useSpaceFeatures();
  const { trigger: trashPages } = useTrashPages();
  function deleteTemplate(pageId: string) {
    return trashPages({ pageIds: [pageId], trash: true });
  }
  const isDisabled = !currentSpacePermissions?.createBounty;

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
    const success = await createReward(newPageValues);
    if (success) {
      closeDialog();
    }
  }

  function createRewardFromTemplate(template: RewardTemplate) {
    openNewPage({
      ...template.page,
      content: template.page.content as PageContent,
      title: undefined,
      type: 'bounty',
      templateId: template.page.id
    });
    setRewardValues({
      rewardType: getRewardType(template.reward),
      ...template.reward
    });
  }

  function selectTemplate(template: RewardTemplate | null) {
    if (template) {
      const templateContentChanged = template.page.content !== newPageValues?.content;

      if (newPageValues?.contentText.length !== 0 && templateContentChanged) {
        overrideContentModalPopupState.open();
      } else {
        createRewardFromTemplate(template);
      }
    } else {
      updateNewPageValues({
        templateId: undefined
      });
    }
    setSelectedTemplate(template);
  }

  const isTemplate = newPageValues?.type === 'bounty_template';
  const errors = getRewardErrors({
    reward: rewardValues,
    rewardType: rewardValues.rewardType,
    page: {
      title: newPageValues?.title || '',
      type: newPageValues?.type || 'bounty'
    }
  });
  const disabledTooltip = errors.join(', ');

  useEffect(() => {
    if (router.query.new) {
      createNewReward();
    } else if (router.query.new_template) {
      createTemplate();
    }
  }, [router.query.new_template, router.query.new]);

  return (
    <>
      <ButtonGroup variant='contained' ref={buttonRef}>
        <Button disabled={isDisabled} data-test='create-suggest-bounty' href='/rewards/new'>
          Create
        </Button>
        <Button disabled={isDisabled} data-test='reward-template-select' size='small' onClick={popupState.open}>
          <KeyboardArrowDown />
        </Button>
      </ButtonGroup>
      <TemplatesMenu
        isLoading={isLoading}
        templates={templates?.map((tpl) => tpl.page) ?? []}
        addPageFromTemplate={(page) => {
          const template = templates?.find((tpl) => tpl.page.id === page.id);
          if (template) {
            createRewardFromTemplate(template);
          }
        }}
        createTemplate={createTemplate}
        editTemplate={(pageId) => showPage(pageId)}
        deleteTemplate={deleteTemplate}
        anchorEl={buttonRef.current as Element}
        boardTitle={getFeatureTitle('Rewards')}
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
        <NewDocumentPage
          key={newPageValues?.templateId}
          titlePlaceholder='Title (required)'
          values={newPageValues}
          onChange={updateNewPageValues}
        >
          <RewardPropertiesForm
            onChange={setRewardValues}
            values={rewardValues}
            isNewReward
            isTemplate={isTemplate}
            expandedByDefault
            selectTemplate={selectTemplate}
            templateId={newPageValues?.templateId}
          />
        </NewDocumentPage>
      </NewPageDialog>
      <ConfirmDeleteModal
        onClose={() => {
          overrideContentModalPopupState.close();
        }}
        open={overrideContentModalPopupState.isOpen}
        title='Overwriting your content'
        buttonText='Overwrite'
        secondaryButtonText='Go back'
        question='Are you sure you want to overwrite your current content with the reward template content?'
        onConfirm={() => {
          if (selectedTemplate?.page?.id) {
            createRewardFromTemplate(selectedTemplate);
          }
        }}
      />
    </>
  );
}
