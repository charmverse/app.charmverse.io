import type { EditorView, PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { ClickAwayListener } from '@mui/material';
import Grow from '@mui/material/Grow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import type { PopupState } from 'material-ui-popup-state/core';
import type { ReactNode } from 'react';
import { useMemo, useCallback, useEffect, useState } from 'react';

import type { NestedPagePluginState } from '../../nestedPage';
import { GroupLabel } from '../../PopoverMenu';
import { palettePluginKey } from '../config';
import {
  useInlinePaletteItems,
  useInlinePaletteQuery
} from '../hooks';
import {
  PaletteItem, PALETTE_ITEM_REGULAR_TYPE
} from '../paletteItem';
import { useEditorItems } from '../useEditorItems';

import InlinePaletteRow from './InlinePaletteRow';

export type InlinePaletteSize = 'small' | 'big';

const StyledPaper = styled(Paper)`
  max-height: '40vh';
  width: '250px';
  overflow-y: 'auto';
  padding: '0 5px';
`;

function getItemsAndHints (
  view: EditorView,
  query: string,
  editorItems: PaletteItem[],
  isItemDisabled: (paletteItem: PaletteItem) => boolean
) {

  const invalidItem = editorItems.find((item) => !(item instanceof PaletteItem));
  if (invalidItem) {
    throw new Error(`uid: "${invalidItem.uid}" must be an instance of PaletteItem`);
  }

  const items: PaletteItem[] = editorItems
    .filter((item) => typeof item.hidden === 'function' ? !item.hidden(view.state) : !item.hidden)
    .filter((item) => queryMatch(item, query) && item.type === PALETTE_ITEM_REGULAR_TYPE)
    .map(item => ({ ...item, _isItemDisabled: isItemDisabled(item) }));

  return { items };
}

const InlinePaletteGroup = styled.div`
  margin: ${({ theme }) => theme.spacing(1, 0)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

interface InlineCommentGroupProps {
  nestedPagePluginKey?: PluginKey<NestedPagePluginState>;
  disableNestedPage?: boolean;
  externalPopupState?: PopupState;
  size?: InlinePaletteSize;
  handleActiveItem?: (item: string) => void;
}

export default function InlineCommandPalette (
  { nestedPagePluginKey, disableNestedPage = false, externalPopupState, size = 'big', handleActiveItem }: InlineCommentGroupProps
) {
  const { query, counter, isVisible, tooltipContentDOM } = useInlinePaletteQuery(palettePluginKey);
  const view = useEditorViewContext();
  const editorItems = useEditorItems({ disableNestedPage, nestedPagePluginKey });
  const isItemDisabled = useCallback(
    (item) => {
      return typeof item.disabled === 'function'
        ? item.disabled(view.state)
        : item.disabled;
    },
    [view]
  );

  const [{ items }, updateItem] = useState(() => {
    return getItemsAndHints(
      view,
      query,
      editorItems,
      isItemDisabled
    );
  });

  const closePalette = useCallback(() => {
    if (externalPopupState && externalPopupState.isOpen) {
      externalPopupState.close();
    }
  }, [externalPopupState]);

  const isInlineCommandVisible = externalPopupState?.isOpen;
  const contentDOM = externalPopupState?.anchorEl;

  useEffect(() => {
    const payload = getItemsAndHints(
      view,
      query,
      editorItems,
      isItemDisabled
    );
    updateItem(payload);
  }, [
    view,
    query,
    editorItems,
    isItemDisabled,
    // so that we recompute things, especially disabled, is palette visibility changes
    isVisible
  ]);

  const { dismissPalette, getItemProps } = useInlinePaletteItems(
    palettePluginKey,
    items,
    counter,
    isItemDisabled
  );

  const paletteGroupItemsRecord: Record<string, ReactNode[]> = useMemo(() => {
    return items.reduce<Record<string, ReactNode[]>>((acc, item, intex) => {
      if ((disableNestedPage && item.uid !== 'insert-page') || !disableNestedPage) {
        const itemProps = { ...getItemProps(item, intex) };
        const itemNode = (
          <MenuItem key={item.uid} disabled={item._isItemDisabled} selected={itemProps.isActive} sx={{ py: 0, px: '4px' }}>
            <InlinePaletteRow
              dataId={item.uid}
              key={item.uid}
              disabled={item._isItemDisabled}
              title={item.title}
              icon={item.icon}
              description={size === 'big' ? item.description : undefined}
              {...itemProps}
              size={size}
              onClick={(e) => {
                itemProps.onClick(e);
                closePalette();
              }}
            />
          </MenuItem>
        );

        if (acc[item.group]) {
          return {
            ...acc,
            [item.group]: [...acc[item.group], itemNode]
          };
        }

        return {
          ...acc,
          [item.group]: [itemNode]
        };
      }
      return acc;
    }, {});
  }, [items, disableNestedPage, size, getItemProps, closePalette]);

  useEffect(() => {
    const activeItem = items.find((item, index) => !!getItemProps(item, index).isActive);
    if (handleActiveItem && !!activeItem) {
      handleActiveItem(activeItem.title);
    }
  }, [items, handleActiveItem]);

  function handleListKeyDown (event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      dismissPalette();
      closePalette();
    }
    else if (event.key === 'Escape') {
      dismissPalette();
      closePalette();
    }
  }

  const filteredPaletteGroupItemsRecord = size === 'small' && paletteGroupItemsRecord.text ? { text: paletteGroupItemsRecord.text } : paletteGroupItemsRecord;

  return (
    <Popper
      open={isInlineCommandVisible || isVisible}
      anchorEl={contentDOM || tooltipContentDOM}
      placement='bottom-start'
      sx={{ zIndex: 1301 }}
    >
      <ClickAwayListener onClickAway={() => closePalette()}>
        <Grow
          in={true}
          style={{
            transformOrigin: 'left top'
          }}
        >
          <StyledPaper>
            <MenuList
              autoFocusItem={isInlineCommandVisible || isVisible}
              onKeyDown={(e) => {
                handleListKeyDown(e);
                closePalette();
              }}
              sx={{ py: 0 }}
            >
              {Object.entries(filteredPaletteGroupItemsRecord).map(([group, paletteItems]) => (
                <InlinePaletteGroup key={group}>
                  <GroupLabel>
                    {size === 'small' ? 'Turn into' : group}
                  </GroupLabel>
                  {paletteItems}
                </InlinePaletteGroup>
              ))}
            </MenuList>
          </StyledPaper>
        </Grow>
      </ClickAwayListener>
    </Popper>
  );
}

function queryMatch (command: PaletteItem, query: string) {
  if (command.skipFiltering) {
    return command;
  }

  if (strMatch(command.title, query)) {
    return command;
  }

  if (command.keywords && strMatch(command.keywords, query)) {
    return command;
  }

  if (strMatch(command.group, query)) {
    return command;
  }

  if (strMatch(command.description, query)) {
    return command;
  }

  return undefined;
}

function strMatch (a: string | string[], b: string): boolean {
  b = b.toLocaleLowerCase();
  if (Array.isArray(a)) {
    return a.filter(Boolean).some((str) => strMatch(str, b));
  }

  a = a.toLocaleLowerCase();
  return a.includes(b) || b.includes(a);
}

// returning -1 means keep order [a, b]
// returning 1 means reverse order ie [b, a]
function fieldExistenceSort (a: Record<string, any>, b: Record<string, any>, field: string, reverse = false) {
  if (a[field] && !b[field]) {
    return reverse ? 1 : -1;
  }

  if (b[field] && !a[field]) {
    return reverse ? -1 : 1;
  }

  return 0;
}
