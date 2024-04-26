import { KeyboardArrowDown } from '@mui/icons-material';
import { ButtonGroup } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import { Button } from 'components/common/Button';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';

export function NewRewardButton() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });
  const [currentSpacePermissions] = useCurrentSpacePermissions();
  const { navigateToSpacePath } = useCharmRouter();
  const isDisabled = !currentSpacePermissions?.createBounty;

  function createNewReward() {
    navigateToSpacePath('/rewards/new');
  }

  function createTemplate() {
    navigateToSpacePath('/rewards/new', { type: 'template' });
  }

  useEffect(() => {
    if (router.query.new) {
      createNewReward();
    } else if (router.query.new_template) {
      createTemplate();
    }
  }, [router.query.new_template, router.query.new]);

  return (
    <ButtonGroup variant='contained' ref={buttonRef}>
      <Button disabled={isDisabled} data-test='create-suggest-bounty' href='/rewards/new'>
        Create
      </Button>
      <Button disabled={isDisabled} data-test='reward-template-select' size='small' onClick={popupState.open}>
        <KeyboardArrowDown />
      </Button>
    </ButtonGroup>
  );
}
