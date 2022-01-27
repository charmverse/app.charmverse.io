import { EditorView } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import styled from '@emotion/styled';
import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import reactDOM from 'react-dom';
import {
  useInlinePaletteItems,
  useInlinePaletteQuery
} from '../../js-lib/inline-palette';
import { InlinePaletteRow } from '../../lib/ui-components';
import { palettePluginKey } from './config';
import {
  PaletteItem, PALETTE_ITEM_REGULAR_TYPE
} from './palette-item';
import { useEditorItems } from './use-editor-items';

function getItemsAndHints(
  view: EditorView,
  query: string,
  editorItems: PaletteItem[],
  isItemDisabled: (paletteItem: PaletteItem) => boolean,
) {
  let items = [...editorItems];
  if (!items.every((item) => item instanceof PaletteItem)) {
    throw new Error(
      `uid: "${items.find((item) => !(item instanceof PaletteItem))?.uid
      }" must be an instance of PaletteItem `,
    );
  }

  items = items.filter((item) =>
    typeof item.hidden === 'function' ? !item.hidden(view.state) : !item.hidden,
  );

  // TODO This is hacky
  items.forEach((item) => {
    item._isItemDisabled = isItemDisabled(item);
  });
  items = items
    .filter(
      (item) =>
        queryMatch(item, query) && item.type === PALETTE_ITEM_REGULAR_TYPE,
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

const InlinePaletteWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.palette.background.default};
  max-width: 400;
  max-height: 400;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  overflow-y: auto;
  padding: 10px;
`

export function InlineCommandPalette() {
  const { query, counter, isVisible, tooltipContentDOM } =
    useInlinePaletteQuery(palettePluginKey);
  const view = useEditorViewContext();

  const editorItems = useEditorItems();
  const isItemDisabled = useCallback(
    (item) => {
      return typeof item.disabled === 'function'
        ? item.disabled(view.state)
        : item.disabled;
    },
    [view],
  );

  const [{ items }, updateItem] = useState(() => {
    return getItemsAndHints(
      view,
      query,
      editorItems,
      isItemDisabled,
    );
  });

  useEffect(() => {
    const payload = getItemsAndHints(
      view,
      query,
      editorItems,
      isItemDisabled,
    );
    updateItem(payload);
  }, [
    view,
    query,
    editorItems,
    isItemDisabled,
    // so that we recompute things, especially disabled, is palette visibility changes
    isVisible,
  ]);

  const { getItemProps } = useInlinePaletteItems(
    palettePluginKey,
    items,
    counter,
    isItemDisabled,
  );

  const paletteGroupItemsRecord: Record<string, ReactNode[]> = {};

  items.forEach((item, i) => {
    const itemProps = { ...getItemProps(item, i) };
    if (!paletteGroupItemsRecord[item.group]) {
      paletteGroupItemsRecord[item.group] = []
    }
    paletteGroupItemsRecord[item.group].push(<InlinePaletteRow
      key={item.uid}
      dataId={item.uid}
      disabled={item._isItemDisabled}
      title={item.title}
      description={item.description}
      icon={item.icon}
      {...itemProps}
    />)
  })

  return reactDOM.createPortal(
    <InlinePaletteWrapper>
      {Object.entries(paletteGroupItemsRecord).map(([group, paletteItems]) => (
        <div key={group} className="inline-palette-group">
          <div className="inline-palette-group-name">
            {group}
          </div>
          <div className="inline-palette-group-items">
            {paletteItems}
          </div>
        </div>))}
    </InlinePaletteWrapper>,
    tooltipContentDOM,
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

// returning -1 means keep order [a, b]
// returning 1 means reverse order ie [b, a]
function fieldExistenceSort(a: Record<string, any>, b: Record<string, any>, field: string, reverse = false) {
  if (a[field] && !b[field]) {
    return reverse ? 1 : -1;
  }

  if (b[field] && !a[field]) {
    return reverse ? -1 : 1;
  }

  return 0;
}