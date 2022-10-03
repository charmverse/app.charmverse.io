
import type { PluginKey } from 'prosemirror-state';
import { useMemo } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';

import type { NestedPagePluginState } from '../nestedPage';
import useNestedPage from '../nestedPage/hooks/useNestedPage';

import { items as databaseItems } from './editorItems/database';
import { items as listItems } from './editorItems/list';
import { items as mediaItems } from './editorItems/media';
import { items as otherItems } from './editorItems/other';
import { items as textItems } from './editorItems/text';
import { PaletteItem } from './paletteItem';
import type { PaletteItemTypeNoGroup } from './paletteItem';

export function useEditorItems ({ disableNestedPage, nestedPagePluginKey }:
    { disableNestedPage: boolean, nestedPagePluginKey?: PluginKey<NestedPagePluginState> }) {
  const { addNestedPage } = useNestedPage();
  const [space] = useCurrentSpace();
  const { user } = useUser();
  const { currentPageId, pages } = usePages();
  const [userSpacePermissions] = useCurrentSpacePermissions();

  const pageType = currentPageId ? pages[currentPageId]?.type : undefined;

  const paletteItems = useMemo(() => {

    const itemGroups: [string, PaletteItemTypeNoGroup[]][] = [
      ['list', listItems()],
      ['media', mediaItems()],
      ['other', otherItems({ addNestedPage, disableNestedPage, nestedPagePluginKey, userSpacePermissions, pageType })],
      ['text', textItems()],
      ['database', (user && space && !disableNestedPage) ? databaseItems({ addNestedPage, currentPageId, userId: user.id, space, pageType }) : []]
    ];

    const itemList = itemGroups.map(([group, items]) => (
      items.map(item => PaletteItem.create({
        ...item,
        group
      }))
    )).flat();

    return itemList;

  }, [addNestedPage, currentPageId, user, space]);

  return paletteItems;
}
