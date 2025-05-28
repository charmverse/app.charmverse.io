import { styled } from '@mui/material';
import { ClickAwayListener } from '@mui/material';
import Grow from '@mui/material/Grow';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import type { PopupState } from 'material-ui-popup-state/hooks';
import type { PluginKey } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { ReactNode } from 'react';
import { useMemo, useCallback, useEffect, useState } from 'react';

import { useEditorViewContext } from '../../@bangle.dev/react/hooks';
import { hideSelectionTooltip } from '../../@bangle.dev/tooltip/selectionTooltip';
import type { NestedPagePluginState } from '../../nestedPage/nestedPage.interfaces';
import { GroupLabel } from '../../PopoverMenu';
import { useInlinePaletteItems, useInlinePaletteQuery } from '../hooks';
import { PaletteItem, PALETTE_ITEM_REGULAR_TYPE } from '../paletteItem';
import { useEditorItems } from '../useEditorItems';

import InlinePaletteRow from './InlinePaletteRow';

export type InlinePaletteSize = 'small' | 'big';

const StyledPaper = styled(Paper)`
  max-height: 400px;
  width: 320px;
  max-width: 100%;
  overflow-y: auto;
  padding: 0 5px;
`;

function getItemsAndHints(
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
    .filter((item) => (typeof item.hidden === 'function' ? !item.hidden(view.state) : !item.hidden))
    .filter((item) => queryMatch(item, query) && item.type === PALETTE_ITEM_REGULAR_TYPE)
    .map((item) => ({ ...item, _isItemDisabled: isItemDisabled(item) }));

  if (query) {
    // Apply the sort based on priority only if the items are in the same group and there is a search query
    return {
      items: items.sort((a, b) => {
        if (a.group === b.group) {
          return (b.priority ?? 0) - (a.priority ?? 0);
        }
        return 0;
      })
    };
  }

  return { items };
}

const InlinePaletteGroup = styled.div`
  margin: ${({ theme }) => theme.spacing(1, 0)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
`;

interface InlineCommentGroupProps {
  menuKey?: PluginKey;
  linkedPagePluginKey?: PluginKey<NestedPagePluginState>;
  disableNestedPage?: boolean;
  filterItem?: (item: PaletteItem) => boolean;
  externalPopupState?: PopupState;
  isFloatingMenuList?: boolean;
  handleActiveItem?: (item: string) => void;
  palettePluginKey: PluginKey;
  enableVoting?: boolean;
  pageId?: string;
}

function defaultFilterItem(item: PaletteItem, { disableNestedPage }: { disableNestedPage: boolean }) {
  return (disableNestedPage && item.uid !== 'insert-page') || !disableNestedPage;
}

export default function InlineCommandPalette({
  menuKey,
  linkedPagePluginKey,
  disableNestedPage = false,
  pageId,
  filterItem,
  externalPopupState,
  isFloatingMenuList = false,
  handleActiveItem,
  palettePluginKey,
  enableVoting
}: InlineCommentGroupProps) {
  const { query, counter, isVisible, tooltipContentDOM } = useInlinePaletteQuery(palettePluginKey);
  const view = useEditorViewContext();
  const editorItems = useEditorItems({ pageId, disableNestedPage, linkedPagePluginKey, enableVoting });
  const isItemDisabled = useCallback(
    (item: PaletteItem) => {
      return typeof item.disabled === 'function' ? item.disabled(view.state) : item.disabled;
    },
    [view]
  );

  const [{ items }, updateItem] = useState(() => {
    return getItemsAndHints(view, query, editorItems, isItemDisabled);
  });

  const closePalette = useCallback(() => {
    if (externalPopupState && externalPopupState.isOpen) {
      externalPopupState.close();
    }
  }, [externalPopupState]);

  const isInlineCommandVisible = externalPopupState?.isOpen;
  const contentDOM = externalPopupState?.anchorEl;

  useEffect(() => {
    const payload = getItemsAndHints(view, query, editorItems, isItemDisabled);
    updateItem(payload);
  }, [
    view,
    query,
    editorItems,
    isItemDisabled,
    // so that we recompute things, especially disabled, is palette visibility changes
    isVisible
  ]);

  const { dismissPalette, getItemProps } = useInlinePaletteItems(palettePluginKey, items, counter, isItemDisabled);

  function closeSubMenu() {
    if (menuKey) {
      hideSelectionTooltip(menuKey)(view.state, view.dispatch, view);
    }
  }

  const paletteGroupItemsRecord: Record<string, ReactNode[]> = useMemo(() => {
    return items.reduce<Record<string, ReactNode[]>>((acc, item, intex) => {
      const canShowItem = filterItem ? filterItem(item) : defaultFilterItem(item, { disableNestedPage });
      if (canShowItem) {
        const itemProps = { ...getItemProps(item, intex) };
        const itemNode = (
          <MenuItem
            key={item.uid}
            disabled={item._isItemDisabled}
            selected={itemProps.isActive}
            sx={{ py: 0, px: '4px' }}
          >
            <InlinePaletteRow
              dataId={item.uid}
              key={item.uid}
              disabled={item._isItemDisabled}
              title={item.title}
              icon={item.icon}
              description={!isFloatingMenuList ? item.description : undefined}
              {...itemProps}
              size={isFloatingMenuList ? 'small' : 'big'}
              onClick={(e) => {
                itemProps.onClick(e);
                closePalette();
                closeSubMenu();
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
  }, [items, disableNestedPage, isFloatingMenuList, getItemProps, closePalette]);

  useEffect(() => {
    const activeItem = items.find((item, index) => !!getItemProps(item, index).isActive);
    if (handleActiveItem && !!activeItem) {
      handleActiveItem(activeItem.title);
    }
  }, [items, handleActiveItem]);

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      close();
    } else if (event.key === 'Escape') {
      close();
    }
  }

  function close() {
    dismissPalette();
    closePalette();
  }

  return (
    <Popper
      open={isInlineCommandVisible || isVisible}
      anchorEl={contentDOM || tooltipContentDOM}
      sx={{ zIndex: 'var(--z-index-tooltip)' }}
      placement='bottom-start'
      modifiers={[
        {
          // ref: https://popper.js.org/docs/v2/modifiers/prevent-overflow/
          name: 'preventOverflow',
          enabled: true,
          options: {
            altAxis: true,
            tether: true,
            padding: 8
          }
        }
      ]}
    >
      <ClickAwayListener onClickAway={() => close()}>
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
                close();
              }}
              sx={{ py: 0 }}
            >
              {Object.entries(paletteGroupItemsRecord).map(([group, paletteItems]) => (
                <InlinePaletteGroup key={group}>
                  <GroupLabel dense sx={{ pl: 1 }}>
                    {isFloatingMenuList ? 'Turn into' : group}
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

function queryMatch(command: PaletteItem, query: string) {
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

function strMatch(a: string | string[], b: string): boolean {
  b = b.toLocaleLowerCase();
  if (Array.isArray(a)) {
    return a.filter(Boolean).some((str) => strMatch(str, b));
  }

  a = a.toLocaleLowerCase();
  return a.includes(b) || b.includes(a);
}
