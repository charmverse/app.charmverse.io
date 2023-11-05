import type { PageType } from '@charmverse/core/prisma';
import type { PluginKey } from 'prosemirror-state';
import { useCallback, memo, useEffect, useMemo } from 'react';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import { useForumCategories } from 'hooks/useForumCategories';
import { usePages } from 'hooks/usePages';
import { insertLinkedPage } from 'lib/prosemirror/insertLinkedPage';
import { safeScrollIntoViewIfNeeded } from 'lib/utilities/browser';
import { stringSimilarity } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';

import type { PluginState as SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import type { NestedPagePluginState } from '../../nestedPage/nestedPage.interfaces';
import type { PageListItem } from '../../PageList';
import PagesList from '../../PageList';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';

const linkablePageTypes: PageType[] = ['card', 'board', 'page', 'bounty', 'proposal', 'linked_board'];

function LinkedPagesList({ pluginKey }: { pluginKey: PluginKey<NestedPagePluginState> }) {
  const { pages } = usePages();
  const { categories } = useForumCategories();
  const view = useEditorViewContext();
  const { tooltipContentDOM, suggestTooltipKey } = usePluginState(pluginKey) as NestedPagePluginState;
  const { triggerText, counter, show: isVisible } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;

  function onClose() {
    hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
  }

  const userPages = useMemo(
    () =>
      Object.values(pages)
        .filter(isTruthy)
        .filter((page) => !page.deletedAt && linkablePageTypes.includes(page.type)),
    [pages]
  );

  const allPages: PageListItem[] = useMemo(() => {
    const categoryPages: PageListItem[] = (categories || []).map((page) => ({
      id: page.id,
      path: page.path || '',
      hasContent: true,
      title: `Forum > ${page.name}`,
      type: 'forum_category',
      icon: null
    }));

    const staticPages: PageListItem[] = STATIC_PAGES.map((page) => ({
      id: page.path,
      path: page.path,
      hasContent: true,
      title: page.title,
      type: page.path,
      icon: null
    }));
    return [...userPages, ...categoryPages, ...staticPages];
  }, [categories, userPages]);

  const filteredPages = useMemo(() => {
    if (triggerText) {
      return sortList({ triggerText, list: allPages, prop: 'title' });
    }
    return userPages;
  }, [triggerText, userPages]);

  const totalItems = filteredPages.length;
  const activeItemIndex = (counter < 0 ? (counter % totalItems) + totalItems : counter) % totalItems;

  const onSelectPage = useCallback(
    (pageId: string, type: PageListItem['type'], path: string) => {
      insertLinkedPage(pluginKey, view, pageId, type, path);
    },
    [view]
  );

  useEffect(() => {
    const activeDomElement = document.querySelector('.mention-selected') as HTMLDivElement;
    if (activeDomElement) {
      safeScrollIntoViewIfNeeded(activeDomElement, true);
    }
  }, [activeItemIndex]);

  return (
    <PopoverMenu container={tooltipContentDOM} isOpen={isVisible} onClose={onClose} width={460}>
      <GroupLabel>Select a page</GroupLabel>
      <PagesList activeItemIndex={activeItemIndex} pages={filteredPages} onSelectPage={onSelectPage} />
    </PopoverMenu>
  );
}

function sortList<T extends object>({
  triggerText,
  list,
  prop
}: {
  triggerText: string;
  list: T[];
  prop: keyof T;
}): T[] {
  return list
    .map((item) => ({ item, similarity: stringSimilarity(item[prop] as string, triggerText) }))
    .filter(({ similarity }) => similarity > 0.09)
    .sort((a, b) => b.similarity - a.similarity)
    .map(({ item }) => item);
}

export default memo(LinkedPagesList);
