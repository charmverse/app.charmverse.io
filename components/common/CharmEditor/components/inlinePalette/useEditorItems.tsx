
import type { PluginKey } from 'prosemirror-state';
import { useMemo } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';

import useNestedPage from '../nestedPage/hooks/useNestedPage';
import type { NestedPagePluginState } from '../nestedPage/nestedPage.interfaces';

import { items as advancedBlocks } from './editorItems/advancedBlocks';
import { items as databaseItems } from './editorItems/database';
import { items as embedItems } from './editorItems/embed';
import { items as mediaItems } from './editorItems/media';
import { items as textItems } from './editorItems/text';
import { PaletteItem } from './paletteItem';
import type { PaletteItemTypeNoGroup } from './paletteItem';

export function useEditorItems ({ disableNestedPage, nestedPagePluginKey }:
    { disableNestedPage: boolean, nestedPagePluginKey?: PluginKey<NestedPagePluginState> }) {
  const { addNestedPage } = useNestedPage();
  const space = useCurrentSpace();
  const { user } = useUser();
  const { currentPageId, pages } = usePages();
  const [userSpacePermissions] = useCurrentSpacePermissions();

  const pageType = currentPageId ? pages[currentPageId]?.type : undefined;

  const paletteItems = useMemo(() => {

    const itemGroups: [string, PaletteItemTypeNoGroup[]][] = [
      ['text', textItems({ addNestedPage, disableNestedPage, nestedPagePluginKey, userSpacePermissions, pageType })],
      ['database', (user && space && !disableNestedPage) ? databaseItems({ addNestedPage, currentPageId, userId: user.id, space, pageType }) : []],
      ['media', mediaItems()],
      ['embed', embedItems()],
      ['advanced blocks', advancedBlocks()]
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
