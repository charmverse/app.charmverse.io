import { EditorView } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import React, { Fragment, ReactNode, useCallback, useEffect, useState } from 'react';
import reactDOM from 'react-dom';
import {
  useInlinePaletteItems,
  useInlinePaletteQuery
} from '../../js-lib/inline-palette';
import { InlinePaletteRow } from '../../lib/ui-components';
import { palettePluginKey } from './config';
import {
  PaletteItem, PALETTE_ITEM_HINT_TYPE,
  PALETTE_ITEM_REGULAR_TYPE
} from './palette-item';
import { useEditorItems } from './use-editor-items';

const staticHints: PaletteItem[] = [
];

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

  let hintItems = [
    ...staticHints,
    ...items.filter((item) => item.type === PALETTE_ITEM_HINT_TYPE),
  ];

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
  return { items, hintItems };
}

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

  const [{ items, hintItems }, updateItem] = useState(() => {
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
    // If we haven't added the group node, add it to set and render the node
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
    <div className="inline-palette-wrapper shadow-2xl">
      {Object.entries(paletteGroupItemsRecord).map(([group, paletteItems]) => (<Fragment key={group}>
        <div className="inline-palette-group">
          <div className="inline-palette-group-name">
            {group}
          </div>
          <div className="inline-palette-group-items">
            {paletteItems}
          </div>
        </div>
      </Fragment>))}
    </div>,
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