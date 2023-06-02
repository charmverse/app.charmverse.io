import { KeyboardArrowDown } from '@mui/icons-material';
import { ButtonGroup, Tooltip, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import React from 'react';

import Button from 'components/common/Button';
import { TemplatesMenu } from 'components/common/TemplatesMenu';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
import type { Card } from 'lib/focalboard/card';
import type { PageMeta } from 'lib/pages';

import { getCurrentBoardTemplates } from '../../store/cards';
import { useAppSelector } from '../../store/hooks';

type Props = {
  addCard: () => void;
  addCardFromTemplate: (cardTemplateId: string) => void;
  addCardTemplate: () => void;
  editCardTemplate: (cardTemplateId: string) => void;
  deleteCardTemplate: (cardTemplateId: string) => void;
  showCard: (cardId: string) => void;
  boardId: string;
};

const NewCardButton = React.memo(
  ({
    addCard,
    addCardFromTemplate,
    addCardTemplate,
    deleteCardTemplate,
    editCardTemplate,
    showCard,
    boardId
  }: Props): JSX.Element => {
    const cardTemplates: Card[] = useAppSelector(getCurrentBoardTemplates);
    const buttonRef = React.useRef<HTMLDivElement>(null);
    const { pages } = usePages();

    const cardTemplatesPages = cardTemplates.map((c) => pages[c.id]).filter((p) => p !== undefined) as PageMeta[];

    const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });

    const boardTitle = boardId ? pages[boardId]?.title || 'Untitled' : undefined;

    const { permissions: pagePermissions } = usePagePermissions({ pageIdOrPath: boardId });

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
          pages={cardTemplatesPages}
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
