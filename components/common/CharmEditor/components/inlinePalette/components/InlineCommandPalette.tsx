import { EditorView } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import { Menu, MenuItem } from '@mui/material';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import MenuList from '@mui/material/MenuList';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import Grow from '@mui/material/Grow';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Portal from '@mui/material/Portal';
import {
  useInlinePaletteItems,
  useInlinePaletteQuery
} from '../hooks';
import InlinePaletteRow from './InlinePaletteRow';
import { palettePluginKey } from '../config';
import {
  PaletteItem, PALETTE_ITEM_REGULAR_TYPE
} from '../paletteItem';
import { useEditorItems } from '../useEditorItems';

function getItemsAndHints (
  view: EditorView,
  query: string,
  editorItems: PaletteItem[],
  isItemDisabled: (paletteItem: PaletteItem) => boolean
) {
  let items = [...editorItems];
  if (!items.every((item) => item instanceof PaletteItem)) {
    throw new Error(
      `uid: "${items.find((item) => !(item instanceof PaletteItem))?.uid
      }" must be an instance of PaletteItem `
    );
  }

  items = items.filter((item) => typeof item.hidden === 'function' ? !item.hidden(view.state) : !item.hidden);

  // TODO This is hacky
  items.forEach((item) => {
    item._isItemDisabled = isItemDisabled(item);
  });
  items = items
    .filter(
      (item) => queryMatch(item, query) && item.type === PALETTE_ITEM_REGULAR_TYPE
    )
    .sort((a, b) => {
      let result = fieldExistenceSort(a, b, 'highPriority');

      if (result !== 0) {
        return result;
      }

      result = fieldExistenceSort(a, b, '_isItemDisabled', true);

      if (result !== 0) {
        return result;
      }

      if (a.group === b.group) {
        return a.title.localeCompare(b.title);
      }
      return a.group.localeCompare(b.group);
    });
  return { items };
}

const GroupLabel = styled(MenuItem)`
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.secondary.main};
  opacity: 1 !important;
`;

const StyledPaper = styled(Paper)`

  // z-index: 10000; // raise above the app bar

    max-height: 350px;
    overflow-y: scroll;
    width: 200px;
`;

const InlinePaletteGroup = styled.div`
  margin: ${({ theme }) => theme.spacing(1, 0)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

export default function InlineCommandPalette () {
  const { query, counter, isVisible, tooltipContentDOM } = useInlinePaletteQuery(palettePluginKey);
  const view = useEditorViewContext();
  const editorItems = useEditorItems();
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
    isVisible && (
      <ClickAwayListener onClickAway={dismissPalette}>
        <Portal container={tooltipContentDOM}>
          <Grow
            in={true}
            style={{
              transformOrigin: 'left top'
            }}
          >
            <StyledPaper>
              <MenuList
                autoFocusItem={isVisible}
                onKeyDown={handleListKeyDown}
                sx={{ py: 0 }}
              >
                {Object.entries(paletteGroupItemsRecord).map(([group, paletteItems]) => (
                  <InlinePaletteGroup key={group}>
                    <GroupLabel disabled>
                      {group}
                    </GroupLabel>
                    {paletteItems}
                  </InlinePaletteGroup>
                ))}
              </MenuList>
            </StyledPaper>
          </Grow>
        </Portal>
      </ClickAwayListener>
    )
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
