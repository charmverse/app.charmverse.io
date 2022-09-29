
import React from 'react';
import { useIntl } from 'react-intl';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { BoardView } from '../../blocks/boardView';
import { Card } from '../../blocks/card';
import mutator from '../../mutator';
import IconButton from '../../widgets/buttons/iconButton';
import CheckIcon from '../../widgets/icons/check';
import EditIcon from '../../widgets/icons/edit';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';

type Props = {
    cardTemplate: Card
    view: BoardView
    addCardFromTemplate: (cardTemplateId: string) => void
    editCardTemplate: (cardTemplateId: string) => void
}

const NewCardButtonTemplateItem = React.memo((props: Props) => {
  const currentView = props.view;
  const { cardTemplate } = props;
  const intl = useIntl();
  const displayName = cardTemplate.title || intl.formatMessage({ id: 'ViewHeader.untitled', defaultMessage: 'Untitled' });
  const isDefaultTemplate = currentView.fields.defaultTemplateId === cardTemplate.id;

  return (
    <Menu.Text
      key={cardTemplate.id}
      id={cardTemplate.id}
      name={displayName}
      icon={<div className='Icon'>{cardTemplate.fields.icon}</div>}
      className={isDefaultTemplate ? 'bold-menu-text' : ''}
      onClick={() => {
        props.addCardFromTemplate(cardTemplate.id);
      }}
      rightIcon={(
        <MenuWrapper stopPropagationOnToggle={true}>
          <IconButton icon={<MoreHorizIcon fontSize='small' />} />
          <Menu position='left'>
            <Menu.Text
              icon={<CheckIcon />}
              id='default'
              name={intl.formatMessage({ id: 'ViewHeader.set-default-template', defaultMessage: 'Set as default' })}
              onClick={async () => {
                await mutator.setDefaultTemplate(currentView.id, currentView.fields.defaultTemplateId, cardTemplate.id);
              }}
            />
            <Menu.Text
              icon={<EditIcon />}
              id='edit'
              name={intl.formatMessage({ id: 'ViewHeader.edit-template', defaultMessage: 'Edit' })}
              onClick={() => {
                props.editCardTemplate(cardTemplate.id);
              }}
            />
            <Menu.Text
              icon={<DeleteOutlineIcon  fontSize='small' color='secondary' />}
              id='delete'
              name={intl.formatMessage({ id: 'ViewHeader.delete-template', defaultMessage: 'Delete' })}
              onClick={async () => {
                await mutator.performAsUndoGroup(async () => {
                  if (currentView.fields.defaultTemplateId === cardTemplate.id) {
                    await mutator.clearDefaultTemplate(currentView.id, currentView.fields.defaultTemplateId);
                  }
                  await mutator.deleteBlock(cardTemplate, 'delete card template');
                });
              }}
            />
          </Menu>
        </MenuWrapper>
              )}
    />
  );
});

export default NewCardButtonTemplateItem;
