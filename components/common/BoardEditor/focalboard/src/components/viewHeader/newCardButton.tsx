
import React from 'react';
import AddIcon from '@mui/icons-material/Add';
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
import {TemplatePageMenuItemWithActions} from './templatePageMenuItemWithActions'
import mutator from '../../mutator';
import { Page } from '@prisma/client';

type Props = {
    board: Board
    addCard: () => void
    // addCardFromTemplate: (cardTemplateId: string) => void
    addCardTemplate: () => void
    editCardTemplate: (cardTemplateId: string) => void
    view: BoardView
    showCard: (cardId: string) => void
}

const NewCardButton = React.memo((props: Props): JSX.Element => {
  const cardTemplates: Card[] = useAppSelector(getCurrentBoardTemplates);
  const currentView = props.view;

  const intl = useIntl();
  const {pages} = usePages()

  async function addPageFromTemplate(pageId: string) {
    const [blocks] = await mutator.duplicateCard({
      board: props.board,
      cardId: pageId,
      cardPage: pages[pageId] as Page
    });
    console.log('Created blocks', blocks)
    props.showCard(blocks[0]?.id)
  }

  return (
    <ButtonWithMenu
      onClick={() => {
          props.addCard();
      }}
      text={(
        <FormattedMessage
          id='ViewHeader.new'
          defaultMessage='New'
        />
      )}
    >
      <Menu position='bottom-end'>
        {cardTemplates.length > 0 && (
          <>
            <Menu.Label>
              <b>
                Templates for {pages[props.board?.id]?.title || 'Untitled' }
              </b>
            </Menu.Label>

            <Menu.Separator />
          </>
        )}
        {/** TODO: Add support for templates */}
        {cardTemplates.map((cardTemplate) => (
          <TemplatePageMenuItemWithActions
            addPageFromTemplate={() => addPageFromTemplate(cardTemplate.id)}
            pageId={cardTemplate.id}
            deleteTemplate={() => null}
            showPage={props.showCard}
          />
      ))}

      <Menu.Text
        icon={<AddIcon/>}
        id='add-template'
        name={intl.formatMessage({id: 'ViewHeader.add-template', defaultMessage: 'New template'})}
        onClick={() => props.addCardTemplate()}
      />
      </Menu>
    </ButtonWithMenu>
  );
});

export default NewCardButton;
