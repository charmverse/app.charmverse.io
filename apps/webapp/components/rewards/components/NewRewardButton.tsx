import { KeyboardArrowDown } from '@mui/icons-material';
import { ButtonGroup } from '@mui/material';
import type { RewardTemplate } from '@packages/lib/rewards/getRewardTemplate';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import { useTrashPages } from 'charmClient/hooks/pages';
import { Button } from 'components/common/Button';
import { TemplatesMenu } from 'components/common/TemplatesMenu/TemplatesMenu';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import { useRewardTemplates } from '../hooks/useRewardTemplates';

export function NewRewardButton() {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });
  const { templates, isLoading } = useRewardTemplates({
    skipDraft: false
  });
  const [currentSpacePermissions] = useCurrentSpacePermissions();
  const { getFeatureTitle } = useSpaceFeatures();
  const { trigger: trashPages } = useTrashPages();
  function deleteTemplate(pageId: string) {
    return trashPages({ pageIds: [pageId], trash: true });
  }
  const { navigateToSpacePath } = useCharmRouter();
  const isDisabled = !currentSpacePermissions?.createBounty;

  function createNewReward() {
    navigateToSpacePath('/rewards/new');
  }

  function createRewardFromTemplate(template: RewardTemplate) {
    navigateToSpacePath(`/rewards/new`, { template: template.page.id });
  }

  function createTemplate() {
    navigateToSpacePath('/rewards/new', { type: 'template' });
  }

  function editTemplate(templateId: string) {
    navigateToSpacePath(`/${templateId}`);
  }

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
        templates={templates?.map((tpl) => ({ ...tpl.page, draft: tpl.status === 'draft' })) ?? []}
        addPageFromTemplate={(page) => {
          const template = templates?.find((tpl) => tpl.page.id === page.id);
          if (template) {
            createRewardFromTemplate(template);
          }
        }}
        createTemplate={createTemplate}
        editTemplate={(pageId) => editTemplate(pageId)}
        deleteTemplate={deleteTemplate}
        anchorEl={buttonRef.current as Element}
        boardTitle={getFeatureTitle('Rewards')}
        popupState={popupState}
        enableItemOptions={isAdmin}
        enableNewTemplates={isAdmin}
      />
    </>
  );
}
