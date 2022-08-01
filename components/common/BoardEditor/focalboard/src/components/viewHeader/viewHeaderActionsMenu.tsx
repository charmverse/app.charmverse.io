// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box } from '@mui/material';
import React from 'react';
import { IntlShape, useIntl } from 'react-intl';
import { Board } from '../../blocks/board';
import { BoardView } from '../../blocks/boardView';
import { Card } from '../../blocks/card';
import { CsvExporter } from '../../csvExporter';
import { useAppSelector } from '../../store/hooks';
import { getMe } from '../../store/users';
import { IUser } from '../../user';
import IconButton from '../../widgets/buttons/iconButton';
import Menu from '../../widgets/menu';
import MenuWrapper from '../../widgets/menuWrapper';
import { sendFlashMessage } from '../flashMessages';
import ModalWrapper from '../modalWrapper';

type Props = {
    board: Board
    activeView: BoardView
    cards: Card[]
}

function onExportCsvTrigger (board: Board, activeView: BoardView, cards: Card[], intl: IntlShape) {
  try {
    CsvExporter.exportTableCsv(board, activeView, cards, intl);
    const exportCompleteMessage = intl.formatMessage({
      id: 'ViewHeader.export-complete',
      defaultMessage: 'Export complete!'
    });
    sendFlashMessage({ content: exportCompleteMessage, severity: 'normal' });
  }
  catch (e) {
    const exportFailedMessage = intl.formatMessage({
      id: 'ViewHeader.export-failed',
      defaultMessage: 'Export failed!'
    });
    sendFlashMessage({ content: exportFailedMessage, severity: 'high' });
  }
}

const ViewHeaderActionsMenu = React.memo((props: Props) => {

  const { board, activeView, cards } = props;
  const user = useAppSelector<IUser|null>(getMe);
  const intl = useIntl();

  return (
    <Box ml={0} mr={2}>
      <ModalWrapper>
        <MenuWrapper label={intl.formatMessage({ id: 'ViewHeader.view-menu', defaultMessage: 'View menu' })}>
          <IconButton icon={<MoreHorizIcon fontSize='small' />} />
          <Menu>
            <Menu.Text
              id='exportCsv'
              name={intl.formatMessage({ id: 'ViewHeader.export-csv', defaultMessage: 'Export to CSV' })}
              onClick={() => onExportCsvTrigger(board, activeView, cards, intl)}
            />
          </Menu>
        </MenuWrapper>
      </ModalWrapper>
    </Box>
  );
});

export default ViewHeaderActionsMenu;
