
import useNestedPage from 'components/common/CharmEditor/components/nestedPage/hooks/useNestedPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { PluginKey } from 'prosemirror-state';
import { useMemo } from 'react';
import { NestedPagePluginState } from '../nestedPage';
import { PaletteItem, PaletteItemTypeNoGroup } from './paletteItem';
import { items as databaseItems } from './editorItems/database';
import { items as listItems } from './editorItems/list';
import { items as mediaItems } from './editorItems/media';
import { items as textItems } from './editorItems/text';
import { items as otherItems } from './editorItems/other';

export function useEditorItems ({ nestedPagePluginKey }: {nestedPagePluginKey?: PluginKey<NestedPagePluginState>}) {
  const { addNestedPage } = useNestedPage();
  const [space] = useCurrentSpace();
  const { user } = useUser();
  const { currentPageId } = usePages();
  const [userSpacePermissions] = useCurrentSpacePermissions();

  const paletteItems = useMemo(() => {

    const itemGroups: [string, PaletteItemTypeNoGroup[]][] = [
      ['list', listItems()],
      ['media', mediaItems()],
      ['other', otherItems({ addNestedPage, nestedPagePluginKey, userSpacePermissions })],
      ['text', textItems()],
      ['database', (user && space) ? databaseItems({ addNestedPage, currentPageId, userId: user.id, space }) : []]
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
