
import React from 'react';

import { useIntl } from 'react-intl';

import CardIcon from '../../widgets/icons/card';
import Menu from '../../widgets/menu';

import MenuWrapper from '../../widgets/menuWrapper';
import OptionsIcon from '../../widgets/icons/options';
import IconButton from '../../widgets/buttons/iconButton';
import CheckIcon from '../../widgets/icons/check';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import mutator from '../../mutator';
import { BoardView } from '../../blocks/boardView';
import { usePages } from 'hooks/usePages';
import { Board } from '../../blocks/board';
import { Page } from '@prisma/client';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

type Props = {
  deleteTemplate: (cardId: string) => void
  addCardFromTemplate: (cardId: string) => void
  showCard: (cardId: string) => void
  view: BoardView
  cardId: string
  board: Board
}

export const TemplateCardMenuItemWithActions = React.memo((props: Props) => {
  const currentView = props.view;
  const intl = useIntl();

  const {pages} = usePages(); 

  return (
    <Menu.Text
      icon={<DescriptionOutlinedIcon />}
      id={`card-template-${props.cardId}`}
      name={pages[props.cardId]?.title || 'Untitled'}
      className={currentView.fields.defaultTemplateId ? '' : 'bold-menu-text'}
      onClick={async() => {
        const [blocks] = await mutator.duplicateCard({
          board: props.board,
          cardId: props.cardId,
          cardPage: pages[props.cardId] as Page
        });
        console.log('Created blocks', blocks)
        props.showCard(blocks[0]?.id)
      }}
      rightIcon={(
        <MenuWrapper stopPropagationOnToggle={true}>
          <IconButton icon={<OptionsIcon />} />
          <Menu position='left'>

            <Menu.Text
              /* TODO - Fix display of this icon, which is currently */
              icon={<ModeEditOutlineOutlinedIcon sx={{hidden: null}} />}
              id='default'
              name='Edit'
              onClick={async () => {
                props.showCard(props.cardId)
                
              }}
            />

          </Menu>
        </MenuWrapper>
      )}
    />
  );
})