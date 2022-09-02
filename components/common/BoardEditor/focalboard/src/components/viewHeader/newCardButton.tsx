
import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import { FormattedMessage, useIntl } from 'react-intl';
import { BoardView } from '../../blocks/boardView';
import { Card } from '../../blocks/card';
import { getCurrentBoardTemplates } from '../../store/cards';
import { useAppSelector } from '../../store/hooks';
import ButtonWithMenu from '../../widgets/buttons/buttonWithMenu';
import Menu from '../../widgets/menu';
import EmptyCardButton from './emptyCardButton';
import { usePages } from 'hooks/usePages';
import { Board } from '../../blocks/board';
import {TemplatesMenu} from './TemplatesMenu'
import mutator from '../../mutator';
import { Page } from '@prisma/client';
import { bindMenu } from 'material-ui-popup-state';
import Button from 'components/common/Button'
import { DownIcon } from 'components/common/Icons/DownIcon';
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks';
import { Divider } from '@mui/material';


type Props = {
    board: Board
    addCard: () => void
    addCardFromTemplate: (cardTemplateId: string) => void
    addCardTemplate: () => void
    editCardTemplate: (cardTemplateId: string) => void
    deleteCardTemplate: (cardTemplateId: string) => void
    view: BoardView
    showCard: (cardId: string) => void
}

const NewCardButton = React.memo((props: Props): JSX.Element => {
  const cardTemplates: Card[] = useAppSelector(getCurrentBoardTemplates);
  const currentView = props.view;
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const intl = useIntl();
  const {pages} = usePages()

  const cardTemplatesPages = cardTemplates.map(c => pages[c.id]).filter(p => p !== undefined) as Page[]

  async function addPageFromTemplate(pageId: string) {
    const [blocks] = await mutator.duplicateCard({
      board: props.board,
      cardId: pageId,
      cardPage: pages[pageId] as Page
    });
    console.log('Created blocks', blocks)
    props.showCard(blocks[0]?.id)
  }

  const popupState = usePopupState({variant: 'popover', popupId: 'templates-menu'});

  return (
    <>
    <Button
      sx={{p: 0}}
      ref={buttonRef}
    >
      <Box
        sx={{pl:'15px'}}
        onClick={() => {
          props.addCard();
      }}>
      New
      </Box>

      <Box sx={{pl: 1}}
        {...bindTrigger(popupState)}>
        <DownIcon />
      </Box>
    </Button>
    <TemplatesMenu
        addPageFromTemplate={addPageFromTemplate}
        createTemplate={props.addCardTemplate}
        editTemplate={props.showCard}
        deleteTemplate={props.deleteCardTemplate}
        pages={cardTemplatesPages}
        anchorEl={buttonRef.current as Element}
        popupState={popupState}
      />
    </>
    
  );
});

export default NewCardButton;
