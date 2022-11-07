import type { PluginKey } from '@bangle.dev/core';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { safeInsert } from '@bangle.dev/utils';
import { ContentCopy as DuplicateIcon, DeleteOutlined as DeleteIcon, DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import type { MenuProps } from '@mui/material';
import { ListItemIcon, ListItemText, Menu, ListItemButton } from '@mui/material';
import type { Page } from '@prisma/client';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import reactDOM from 'react-dom';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { getSortedBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { useAppDispatch, useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { initialLoad } from 'components/common/BoardEditor/focalboard/src/store/initialLoad';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import log from 'lib/log';

import type { PluginState } from './rowActions';

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

function Component ({ menuState }: { menuState: PluginState }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'user-role' });
  const view = useEditorViewContext();
  const { deletePage, currentPageId, pages } = usePages();
  const currentPage = pages[currentPageId];
  const currentSpace = useCurrentSpace();
  const dispatch = useAppDispatch();
  const boards = useAppSelector(getSortedBoards);

  function _getNode () {
    if (!menuState.rowPos || !menuState.rowDOM) {
      return null;
    }

    // calculate the node at the mouse position. do it on click in case the content has changed
    let topPos = view.state.doc.resolve(menuState.rowPos);
    while (topPos.depth > 1 || (topPos.depth === 1 && topPos.parentOffset > 0)) {
      const parentOffset = topPos.pos - (topPos.parentOffset > 0 ? topPos.parentOffset : 1); // if parentOffset is 0, step back by 1
      topPos = view.state.doc.resolve(parentOffset);
    }

    // console.log('Position of row', topPos, { node: topPos.node() });

    let pmNode = topPos.node();
    // handle top-level children, where pmNode === doc
    if (menuState.rowNodeOffset && menuState.rowNodeOffset > 0) {
      const child = pmNode.maybeChild(menuState.rowNodeOffset);
      pmNode = child || pmNode;
    }

    const nodeStart = topPos.pos;
    const nodeSize = (pmNode && pmNode.type.name !== 'doc') ? pmNode.nodeSize : 0;
    let nodeEnd = nodeStart + nodeSize; // nodeSize includes the start and end tokens, so we need to subtract 1

    // dont delete past end of document - according to PM guide, use content.size not nodeSize for the doc
    if (nodeEnd > view.state.doc.content.size) {
      nodeEnd = view.state.doc.content.size;
    }

    log.debug('Row meta', { nodeStart, topPos: topPos.pos, pmNode, nodeEnd, nodeSize });

    return {
      node: pmNode,
      nodeEnd,
      nodeStart
    };
  }

  function deleteRow () {
    const node = _getNode();

    if (node) {
      let start = node.nodeStart;
      let end = node.nodeEnd;
      // fix for toggles, but also assuming that pos 1 or 0 is always the first line anyway
      if (start === 1) {
        start = 0;
        end -= 1;
      }
      view.dispatch(view.state.tr.deleteRange(start, end));
      popupState.close();

      // If its an embedded inline database delete the board page
      const page = pages[node.node.attrs.pageId];
      if (page?.type === 'inline_board' || page?.type === 'inline_linked_board') {
        const board = boards.find(b => b.id === page.id);
        deletePage({
          board,
          pageId: page.id
        });
      }
    }
  }

  async function duplicateRow () {
    const node = _getNode();
    const tr = view.state.tr;
    if (node?.node.type.name === 'page' && currentPage) {
      if (currentSpace && node?.node.attrs.id) {
        const duplicatedPage = await charmClient.duplicatePage(node?.node.attrs.id, currentPage.id);
        const newNode = view.state.schema.nodes.page.create({
          id: duplicatedPage.id
        });
        const newTr = safeInsert(newNode, node.nodeEnd)(tr);
        view.dispatch(newTr.scrollIntoView());
        dispatch(initialLoad({ spaceId: currentSpace.id }));
        await mutate(`pages/${currentSpace.id}`, (_pages: Page[]) => {
          return [..._pages, duplicatedPage];
        }, {
          revalidate: true
        });
      }
    }
    else if (node) {
      const copy = node.node.copy(node.node.content);
      const newTr = safeInsert(copy, node.nodeEnd)(tr);
      view.dispatch(newTr.scrollIntoView());
    }
    popupState.close();
  }

  return (
    <>
      <span className='charm-drag-handle' draggable='true'>
        <DragIndicatorIcon color='secondary' {...bindTrigger(popupState)} />
      </span>

      <Menu
        {...bindMenu(popupState)}
        {...menuPosition}
      >
        <ListItemButton onClick={deleteRow} dense>
          <ListItemIcon><DeleteIcon color='secondary' /></ListItemIcon>
          <ListItemText primary='Delete' />
        </ListItemButton>
        <ListItemButton onClick={duplicateRow} dense>
          <ListItemIcon><DuplicateIcon color='secondary' /></ListItemIcon>
          <ListItemText primary='Duplicate' />
        </ListItemButton>
      </Menu>
    </>
  );
}

export default function RowActionsMenu ({ pluginKey }: { pluginKey: PluginKey }) {

  const menuState: PluginState = usePluginState(pluginKey);

  // Fixes the case where undefined menu state throws an error
  if (!menuState) {
    return null;
  }

  return reactDOM.createPortal(<Component menuState={menuState} />, menuState.tooltipDOM);
}
