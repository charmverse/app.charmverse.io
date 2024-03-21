import { safeInsert } from '@bangle.dev/utils';
import { log } from '@charmverse/core/log';
import {
  Add as AddIcon,
  ContentCopy as DuplicateIcon,
  DragIndicator as DragIndicatorIcon,
  DeleteOutlined
} from '@mui/icons-material';
import type { MenuProps } from '@mui/material';
import { ListItemIcon, ListItemText, Menu, ListItemButton, Tooltip, Typography } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { TextSelection } from 'prosemirror-state';
import type { PluginKey } from 'prosemirror-state';
import type { MouseEvent } from 'react';
import reactDOM from 'react-dom';

import charmClient from 'charmClient';
import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { getSortedBoards } from 'components/common/DatabaseEditor/store/boards';
import { useAppSelector } from 'components/common/DatabaseEditor/store/hooks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { isMac } from 'lib/utils/browser';

import { nestedPageNodeName } from '../nestedPage/nestedPage.constants';

import { deleteRowNode, getNodeForRowPosition, type PluginState } from './rowActions';

const menuPosition: Partial<MenuProps> = {
  anchorOrigin: {
    horizontal: 'left',
    vertical: 'bottom'
  },
  transformOrigin: {
    vertical: 'center',
    horizontal: 'right'
  }
};

function Component({ menuState }: { menuState: PluginState }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'user-role' });
  const view = useEditorViewContext();
  const { deletePage, pages } = usePages();
  const { space: currentSpace } = useCurrentSpace();
  const boards = useAppSelector(getSortedBoards);

  function deleteRow() {
    const deletedNode = deleteRowNode({
      view,
      rowPosition: menuState.rowPos,
      rowNodeOffset: menuState.rowNodeOffset
    });

    if (deletedNode) {
      popupState.close();

      // If its an embedded inline database delete the board page
      const page = pages[deletedNode.node.attrs.pageId];
      if (page?.type === 'inline_board' || page?.type === 'inline_linked_board') {
        const board = boards.find((b) => b.id === page.id);
        deletePage({
          board,
          pageId: page.id
        });
      }
    }
  }

  async function duplicateRow() {
    const node = getNodeForRowPosition({ view, rowPosition: menuState.rowPos, rowNodeOffset: menuState.rowNodeOffset });
    const nodeTypeName = node?.node.type.name;
    const tr = view.state.tr;
    if (nodeTypeName === 'page') {
      if (currentSpace && node?.node.attrs.id) {
        const { rootPageId } = await charmClient.pages.duplicatePage({
          pageId: node.node.attrs.id
        });
        const newNode = view.state.schema.nodes[nestedPageNodeName].create({
          id: rootPageId
        });
        const newTr = safeInsert(newNode, node.nodeEnd)(tr);
        view.dispatch(newTr.scrollIntoView());
      }
    } else if (nodeTypeName === 'inlineDatabase') {
      if (currentSpace && node?.node.attrs.pageId) {
        const { rootPageId: newPageId } = await charmClient.pages.duplicatePage({
          pageId: node.node.attrs.pageId
        });
        const newNode = view.state.schema.nodes.inlineDatabase.create({
          pageId: newPageId
        });
        const newTr = safeInsert(newNode, node.nodeEnd)(tr);
        view.dispatch(newTr.scrollIntoView());
      }
    } else if (node) {
      const copy = node.node.copy(node.node.content);
      const newTr = safeInsert(copy, nodeTypeName === 'columnLayout' ? node.nodeEnd - 1 : node.nodeEnd)(tr);
      view.dispatch(newTr.scrollIntoView());
    }
    popupState.close();
  }

  function addNewRow(e: MouseEvent) {
    const node = getNodeForRowPosition({ view, rowPosition: menuState.rowPos, rowNodeOffset: menuState.rowNodeOffset });
    if (!node) {
      log.warn('no node identified to add new row');
      return;
    }
    let insertPos = -1;
    // insert before
    if (e.altKey) {
      insertPos = node.nodeStart > 0 ? node.nodeStart - 1 : 0;
    }
    // insert after
    else {
      insertPos = node.node.type.name === 'columnLayout' ? node.nodeEnd - 1 : node.nodeEnd;
    }
    const tr = view.state.tr;
    // TODO: Trigger component select menu
    // const emptyLine = view.state.schema.nodes.paragraph.create(
    //   null,
    //   Fragment.fromArray([
    //     view.state.schema.text('', [view.state.schema.mark('inline-command-palette-paletteMark', { trigger: '/' })])
    //   ])
    // );
    const emptyLine = view.state.schema.nodes.paragraph.create();
    // const newTr = safeInsert(emptyLine, insertPos)(tr);

    tr.setSelection(TextSelection.create(tr.doc, insertPos));
    tr.replaceSelectionWith(emptyLine, false);
    tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
    view.dispatch(tr.scrollIntoView());
    view.focus();
  }

  const optionKey = isMac() ? 'Option' : 'Alt';

  return (
    <>
      <span className='charm-drag-handle' draggable='true'>
        <Tooltip
          title={
            <>
              <Typography fontWeight='bold' variant='caption'>
                Click<span style={{ color: 'lightgray' }}> to add below</span>
              </Typography>
              <br />
              <Typography fontWeight='bold' variant='caption'>
                {optionKey}-click<span style={{ color: 'lightgray' }}> to add above</span>
              </Typography>
            </>
          }
        >
          <AddIcon style={{ cursor: 'text' }} onClick={addNewRow} />
        </Tooltip>
        <DragIndicatorIcon color='secondary' {...bindTrigger(popupState)} />
      </span>

      <Menu {...bindMenu(popupState)} {...menuPosition}>
        <ListItemButton onClick={deleteRow} dense>
          <ListItemIcon>
            <DeleteOutlined color='secondary' />
          </ListItemIcon>
          <ListItemText primary='Delete' />
        </ListItemButton>
        <ListItemButton onClick={duplicateRow} dense>
          <ListItemIcon>
            <DuplicateIcon color='secondary' />
          </ListItemIcon>
          <ListItemText primary='Duplicate' />
        </ListItemButton>
      </Menu>
    </>
  );
}

export default function RowActionsMenu({ pluginKey }: { pluginKey: PluginKey }) {
  const menuState: PluginState = usePluginState(pluginKey);

  // Fixes the case where undefined menu state throws an error
  if (!menuState) {
    return null;
  }

  return reactDOM.createPortal(<Component menuState={menuState} />, menuState.tooltipDOM);
}
