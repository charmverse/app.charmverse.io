import { KeyboardArrowDown } from '@mui/icons-material';
import { ButtonGroup, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { memo, useRef, useMemo } from 'react';

import { Button } from 'components/common/Button';
import { TemplatesMenu } from 'components/common/TemplatesMenu/TemplatesMenu';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
import type { Card } from 'lib/databases/card';

import { makeSelectBoardTemplates } from '../../store/cards';
import { useAppSelector } from '../../store/hooks';

type Props = {
  addCard: () => void;
  addCardFromTemplate: (card: Card) => void;
  addCardTemplate: () => void;
  deleteCardTemplate: (cardTemplateId: string) => void;
  showCard: (cardId: string) => void;
  templatesBoardId?: string;
};

const NewCardButton = memo(
  ({
    addCard,
    addCardFromTemplate,
    addCardTemplate,
    deleteCardTemplate,
    showCard,
    templatesBoardId
  }: Props): JSX.Element => {
    const selectBoardTemplates = useMemo(makeSelectBoardTemplates, []);
    const cardTemplates: Card[] = useAppSelector((state) => selectBoardTemplates(state, templatesBoardId || ''));
    const buttonRef = useRef<HTMLDivElement>(null);
    const { pages } = usePages();

    const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });

    const boardTitle = templatesBoardId ? pages[templatesBoardId]?.title || 'Untitled' : undefined;

    const { permissions: pagePermissions } = usePagePermissions({ pageIdOrPath: templatesBoardId || null });

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
