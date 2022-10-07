import type { EditorView, PluginKey } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { MenuItem } from '@mui/material';
import MenuList from '@mui/material/MenuList';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import type { NestedPagePluginState } from '../../nestedPage';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';
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

  let items = editorItems.filter((item) => typeof item.hidden === 'function' ? !item.hidden(view.state) : !item.hidden);

  // TODO This is hacky
  items.forEach((item) => {
    item._isItemDisabled = isItemDisabled(item);
  });
  items = items
    .filter(
      (item) => queryMatch(item, query) && item.type === PALETTE_ITEM_REGULAR_TYPE
    );
  return { items };
}

const InlinePaletteGroup = styled.div`
  margin: ${({ theme }) => theme.spacing(1, 0)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

export default function InlineCommandPalette (
  { nestedPagePluginKey, disableNestedPage = false }: { nestedPagePluginKey?: PluginKey<NestedPagePluginState>, disableNestedPage?: boolean }
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

  const paletteGroupItemsRecord: Record<string, ReactNode[]> = {};

  items.forEach((item, i) => {
    if ((disableNestedPage && item.uid !== 'insert-page') || !disableNestedPage) {
      const itemProps = { ...getItemProps(item, i) };
      if (!paletteGroupItemsRecord[item.group]) {
        paletteGroupItemsRecord[item.group] = [];
      }
      paletteGroupItemsRecord[item.group].push(
        <MenuItem key={item.uid} disabled={item._isItemDisabled} selected={itemProps.isActive} sx={{ py: 0 }}>
          <InlinePaletteRow
            dataId={item.uid}
            key={item.uid}
            disabled={item._isItemDisabled}
            title={item.title}
            icon={item.icon}
            {...itemProps}
          />
        </MenuItem>
      );
    }
  });

  function handleListKeyDown (event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      dismissPalette();
    }
    else if (event.key === 'Escape') {
      dismissPalette();
    }
  }

  return (
    <PopoverMenu
      isOpen={isVisible}
      container={tooltipContentDOM}
      onClose={dismissPalette}
    >
      <MenuList
        autoFocusItem={isVisible}
        onKeyDown={handleListKeyDown}
        sx={{ py: 0 }}
      >
        {Object.entries(paletteGroupItemsRecord).map(([group, paletteItems]) => (
          <InlinePaletteGroup key={group}>
            <GroupLabel>
              {group}
            </GroupLabel>
            {paletteItems}
          </InlinePaletteGroup>
        ))}
      </MenuList>
    </PopoverMenu>
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
