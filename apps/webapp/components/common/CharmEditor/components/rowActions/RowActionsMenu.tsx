import { safeInsert } from '@bangle.dev/utils';
import { log } from '@charmverse/core/log';
import {
  Add as AddIcon,
  ContentCopy as DuplicateIcon,
  DragIndicator as DragIndicatorIcon,
  DeleteOutlined
} from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';
import type { MenuProps } from '@mui/material';
import { ListItemIcon, ListItemText, Menu, ListItemButton, Tooltip, Typography } from '@mui/material';
import { getSortedBoards } from '@packages/databases/store/boards';
import { useAppSelector } from '@packages/databases/store/hooks';
import { isMac } from '@packages/lib/utils/browser';
import { slugify } from '@packages/utils/strings';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { TextSelection } from 'prosemirror-state';
import type { PluginKey } from 'prosemirror-state';
import type { MouseEvent } from 'react';
import reactDOM from 'react-dom';
import { useCopyToClipboard } from 'usehooks-ts';

import charmClient from 'charmClient';
import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';

import { getHeadingLink } from '../heading';
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
  const [, copyFn] = useCopyToClipboard();
  const { showMessage } = useSnackbar();

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

  let isHeadingNode = false;
  if (menuState.rowPos !== undefined && menuState.rowPos >= 0 && menuState.rowPos <= view.state.doc.content.size) {
    isHeadingNode = view.state.doc.resolve(menuState.rowPos)?.node()?.type.name === 'heading';
  }
  async function copyLinkToBlock() {
    const rowPosition = menuState.rowPos;
    if (rowPosition === undefined) {
      popupState.close();
      return null;
    }

    const topPos = view.state.doc.resolve(rowPosition);
    const node = topPos.node();

    if (node && node.type.name === 'heading') {
      const link = getHeadingLink(node.textContent);
      copyFn(link).then(() => {
        showMessage('Link copied to clipboard', 'success');
      });
    }
    popupState.close();
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
    } else if (nodeTypeName === 'mention' && node) {
      const mentionCopy = node.node.copy(node.node.content);
      const newParagraph = view.state.schema.nodes.paragraph.create(null, mentionCopy);
      const newTr = safeInsert(newParagraph, node.nodeEnd)(tr);
      view.dispatch(newTr.scrollIntoView());
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
            <DuplicateIcon fontSize='small' color='secondary' />
          </ListItemIcon>
          <ListItemText primary='Duplicate' />
        </ListItemButton>
        {isHeadingNode && (
          <ListItemButton onClick={copyLinkToBlock} dense>
            <ListItemIcon>
              <LinkIcon color='secondary' />
            </ListItemIcon>
            <ListItemText primary='Copy link to block' />
          </ListItemButton>
        )}
      </Menu>
    </>
  );
}

export function RowActionsMenu({ pluginKey }: { pluginKey: PluginKey }) {
  const menuState: PluginState = usePluginState(pluginKey);

  // Fixes the case where undefined menu state throws an error
  if (!menuState) {
    return null;
  }

  return reactDOM.createPortal(<Component menuState={menuState} />, menuState.tooltipDOM);
}
