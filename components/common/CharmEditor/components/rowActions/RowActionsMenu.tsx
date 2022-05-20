import { MoreHoriz as MoreHorizIcon, ContentCopy as DuplicateIcon, DeleteOutlined as DeleteIcon } from '@mui/icons-material';
import { usePluginState, useEditorViewContext } from '@bangle.dev/react';
import { ListItemIcon, ListItemText, Menu, MenuItem, MenuProps } from '@mui/material';
import { PluginKey } from '@bangle.dev/core';
import { safeInsert } from '@bangle.dev/utils';
import reactDOM from 'react-dom';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
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

  function _getNode () {
    if (!menuState.rowPos || !menuState.rowDOM) {
      return null;
    }

    // calculate the node at the mouse position. do it on click in case content has changed
    let topPos = view.state.doc.resolve(menuState.rowPos);
    while (topPos.depth > 1 || (topPos.depth === 1 && topPos.parentOffset > 0)) {
      const parentOffset = topPos.pos - (topPos.parentOffset > 0 ? topPos.parentOffset : 1); // if parentOffset is 0, step back by 1
      topPos = view.state.doc.resolve(parentOffset);
    }

    // console.log('Position of row', topPos, { startPos, ogPos: ob, node: topPos.node() });

    let pmNode = topPos.node();
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
      view.dispatch(view.state.tr.deleteRange(node.nodeStart, node.nodeEnd));
      popupState.close();
    }
  }

  function duplicateRow () {
    const node = _getNode();
    if (node) {
      const copy = node.node.copy(node.node.content);
      const tr = view.state.tr;
      const newTr = safeInsert(copy, node.nodeEnd)(tr);
      view.dispatch(newTr.scrollIntoView());
      popupState.close();
    }
  }

  return (
    <>
      <MoreHorizIcon color='secondary' {...bindTrigger(popupState)} />

      <Menu
        {...bindMenu(popupState)}
        {...menuPosition}
      >
        <MenuItem onClick={deleteRow}>
          <ListItemIcon><DeleteIcon color='secondary' /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
        <MenuItem onClick={duplicateRow}>
          <ListItemIcon><DuplicateIcon color='secondary' fontSize='small' /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export default function RowActionsMenu ({ pluginKey }: { pluginKey: PluginKey }) {

  const menuState: PluginState = usePluginState(pluginKey);

  return reactDOM.createPortal(<Component menuState={menuState} />, menuState.tooltipDOM);
}
