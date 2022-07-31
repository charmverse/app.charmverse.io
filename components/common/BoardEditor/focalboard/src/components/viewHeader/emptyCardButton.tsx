// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import { useIntl } from 'react-intl';

import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CardIcon from '../../widgets/icons/card';
import Menu from '../../widgets/menu';

import mutator from '../../mutator';
import { useAppSelector } from '../../store/hooks';
import { getCurrentView } from '../../store/views';
import IconButton from '../../widgets/buttons/iconButton';
import CheckIcon from '../../widgets/icons/check';
import MenuWrapper from '../../widgets/menuWrapper';

type Props = {
    addCard: () => void
}

const EmptyCardButton = React.memo((props: Props) => {
  const currentView = useAppSelector(getCurrentView);
  const intl = useIntl();

  return (
    <Menu.Text
      icon={<CardIcon />}
      id='empty-template'
      name={intl.formatMessage({ id: 'ViewHeader.empty-card', defaultMessage: 'Empty card' })}
      className={currentView.fields.defaultTemplateId ? '' : 'bold-menu-text'}
      onClick={() => {
        props.addCard();
      }}
      rightIcon={(
        <MenuWrapper stopPropagationOnToggle={true}>
          <IconButton icon={<MoreHorizIcon fontSize='small' />} />
          <Menu position='left'>
            <Menu.Text
              icon={<CheckIcon />}
              id='default'
              name={intl.formatMessage({
                id: 'ViewHeader.set-default-template',
                defaultMessage: 'Set as default'
              })}
              onClick={async () => {
                await mutator.clearDefaultTemplate(currentView.id, currentView.fields.defaultTemplateId);
              }}
            />
          </Menu>
        </MenuWrapper>
              )}
    />
  );
});

export default EmptyCardButton;
