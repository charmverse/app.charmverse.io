import type { PluginKey } from 'prosemirror-state';
import { useMemo } from 'react';

import { useEditorViewContext } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';

import { useAddNestedPage } from '../nestedPage/hooks/useAddNestedPage';
import type { NestedPagePluginState } from '../nestedPage/nestedPage.interfaces';

import { items as advancedBlocks } from './editorItems/advancedBlocks';
import { items as databaseItems } from './editorItems/database';
import { items as embedItems } from './editorItems/embed';
import { items as mediaItems } from './editorItems/media';
import { items as textItems } from './editorItems/text';
import { PaletteItem } from './paletteItem';
import type { PaletteItemTypeNoGroup } from './paletteItem';

export function useEditorItems({
  disableNestedPage,
  linkedPagePluginKey,
  enableVoting,
  pageId
}: {
  disableNestedPage: boolean;
  // Defaults to true
  enableVoting?: boolean;
  linkedPagePluginKey?: PluginKey<NestedPagePluginState>;
  pageId?: string;
}) {
  const { addNestedPage } = useAddNestedPage(pageId);
  const { space } = useCurrentSpace();
  const { user } = useUser();
  const { pages } = usePages();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const view = useEditorViewContext();

  const pageType = pageId ? pages[pageId]?.type : undefined;

  const paletteItems = useMemo(() => {
    const itemGroups: [string, PaletteItemTypeNoGroup[]][] = [
      ['text', textItems({ addNestedPage, disableNestedPage, linkedPagePluginKey, userSpacePermissions, pageType })],
      [
        'database',
        user && space && !disableNestedPage && pageId
          ? databaseItems({ addNestedPage, currentPageId: pageId, userId: user.id, space, pageType })
          : []
      ],
      ['media', mediaItems()],
      ['embed', embedItems()],
      ['advanced blocks', advancedBlocks({ view, enableVoting })]
    ];

    const itemList = itemGroups
      .map(([group, items]) =>
        items.map((item) =>
          PaletteItem.create({
            ...item,
            group
          })
        )
      )
      .flat();

    return itemList;
    // include selection since we use cursor position as context, but we should find a way to only generate this when the popup appears
  }, [addNestedPage, pageId, user, space, view.state.selection]);

  return paletteItems;
}
