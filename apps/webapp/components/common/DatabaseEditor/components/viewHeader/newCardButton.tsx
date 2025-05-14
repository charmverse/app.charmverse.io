import { KeyboardArrowDown } from '@mui/icons-material';
import { ButtonGroup, Typography } from '@mui/material';
import type { Card } from '@packages/databases/card';
import { makeSelectBoardTemplates } from '@packages/databases/store/cards';
import { useAppSelector } from '@packages/databases/store/hooks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { memo, useRef, useMemo } from 'react';

import { Button } from 'components/common/Button';
import { TemplatesMenu } from 'components/common/TemplatesMenu/TemplatesMenu';
import { usePagePermissions } from 'hooks/usePagePermissions';

type Props = {
  addCard: () => void;
  addCardFromTemplate: (card: Card) => void;
  addCardTemplate: () => void;
  deleteCardTemplate: (cardTemplateId: string) => void;
  showCard: (cardId: string) => void;
  templatesBoard?: { id: string; title: string };
};

const NewCardButton = memo(
  ({
    addCard,
    addCardFromTemplate,
    addCardTemplate,
    deleteCardTemplate,
    showCard,
    templatesBoard
  }: Props): JSX.Element => {
    const selectBoardTemplates = useMemo(makeSelectBoardTemplates, []);
    const cardTemplates: Card[] = useAppSelector((state) => selectBoardTemplates(state, templatesBoard?.id || ''));
    const buttonRef = useRef<HTMLDivElement>(null);

    const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });

    const boardTitle = templatesBoard ? templatesBoard.title || 'Untitled' : undefined;

    const { permissions: pagePermissions } = usePagePermissions({ pageIdOrPath: templatesBoard?.id || null });

    return (
      <>
        <ButtonGroup size='small' disableElevation variant='contained' ref={buttonRef}>
          <Button onClick={addCard}>
            <Typography fontWeight={700} variant='subtitle1' component='div'>
              New
            </Typography>
          </Button>
          <Button sx={{ minWidth: '30px !important', px: 0 }} onClick={popupState.open}>
            <KeyboardArrowDown fontSize='small' />
          </Button>
        </ButtonGroup>

        <TemplatesMenu
          addPageFromTemplate={addCardFromTemplate}
          createTemplate={addCardTemplate}
          editTemplate={showCard}
          deleteTemplate={deleteCardTemplate}
          templates={cardTemplates}
          anchorEl={buttonRef.current as Element}
          popupState={popupState}
          boardTitle={boardTitle}
          enableItemOptions={pagePermissions?.edit_content}
          enableNewTemplates={pagePermissions?.edit_content}
        />
      </>
    );
  }
);

export default NewCardButton;
