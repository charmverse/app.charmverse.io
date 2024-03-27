import type { PageType } from '@charmverse/core/prisma';
import type { PluginKey } from 'prosemirror-state';
import { useCallback, memo, useEffect, useMemo, useState } from 'react';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import type { PageListItem } from 'components/common/PagesList';
import { PagesList } from 'components/common/PagesList';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { useForumCategories } from 'hooks/useForumCategories';
import { usePages } from 'hooks/usePages';
import { useSearchPages } from 'hooks/useSearchPages';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { STATIC_PAGES } from 'lib/features/constants';
import { insertLinkedPage } from 'lib/prosemirror/insertLinkedPage';
import { safeScrollIntoViewIfNeeded } from 'lib/utils/browser';
import { stringSimilarity } from 'lib/utils/strings';
import { isTruthy } from 'lib/utils/types';

import type { PluginState as SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import type { NestedPagePluginState } from '../../nestedPage/nestedPage.interfaces';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';

// not sure why we needed to filter this list, leaving it for now - Mar, 2024
// const linkablePageTypes: PageType[] = ['card', 'board', 'page', 'bounty', 'proposal', 'linked_board'];

function _LinkedPagesPopup({ pluginKey }: { pluginKey: PluginKey<NestedPagePluginState> }) {
  const view = useEditorViewContext();
  const { tooltipContentDOM, suggestTooltipKey } = usePluginState(pluginKey) as NestedPagePluginState;
  const { triggerText, counter, show: isVisible } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;

  function onClose() {
    hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
  }

  const onSelectPage = useCallback(
    (pageId: string, type: PageListItem['type'], path: string) => {
      insertLinkedPage(pluginKey, view, pageId, type, path);
    },
    [view, pluginKey]
  );

  return (
    <PopoverMenu container={tooltipContentDOM} isOpen={isVisible} onClose={onClose} width={460}>
      <GroupLabel>Select a page</GroupLabel>
      <PagesListWithContext counter={counter} triggerText={triggerText} onSelectPage={onSelectPage} />
    </PopoverMenu>
  );
}
function PagesListWithContext({
  counter,
  triggerText,
  onSelectPage
}: {
  counter: number;
  triggerText: string;
  onSelectPage: (pageId: string, type: PageListItem['type'], path: string) => void;
}) {
  const { pages } = usePages();
  const { categories } = useForumCategories();
  const { mappedFeatures } = useSpaceFeatures();
  const { results: searchResults, isValidating } = useSearchPages({ search: triggerText, limit: 50 });
  // keep track of static results, only update if isValidating is false
  const [filteredPages, setFilteredPages] = useState<PageListItem[]>([]);

  const staticPages: PageListItem[] = useMemo(() => {
    return STATIC_PAGES.map((page) => {
      return {
        id: page.path,
        path: page.path,
        hasContent: true,
        title: mappedFeatures[page.feature]?.title,
        type: page.path,
        icon: null
      };
    });
  }, [mappedFeatures]);

  const filteredCategoryPages: PageListItem[] = useMemo(() => {
    return (categories || [])
      .filter((option) => {
        return option.name.toLowerCase().includes(triggerText.toLowerCase());
      })
      .map((page) => ({
        id: page.id,
        path: page.path || '',
        hasContent: true,
        title: `Category > ${page.name}`,
        type: 'forum_category',
        icon: null
      }));
  }, [categories, triggerText]);

  useEffect(() => {
    if (!isValidating) {
      const filteredStaticPages = staticPages.filter((option) => {
        return option.title.toLowerCase().includes(triggerText.toLowerCase());
      });
      setFilteredPages([...searchResults, ...filteredStaticPages, ...filteredCategoryPages]);
    }
  }, [isValidating, triggerText, searchResults, staticPages, filteredCategoryPages]);

  const options = useMemo(() => {
    if (triggerText) {
      return sortList({ triggerText, list: filteredPages });
    }
    // show default list (root pages from sidebar)
    const rootPages = Object.values(pages)
      .filter((page) => page && !page.parentId && (page.type === 'board' || page.type === 'page'))
      .filter(isTruthy)
      .sort((a, b) => a.index - b.index);
    return [...staticPages, ...rootPages];
  }, [triggerText, pages, filteredPages, staticPages]);

  const totalItems = options.length;
  const activeItemIndex = (counter < 0 ? (counter % totalItems) + totalItems : counter) % totalItems;

  useEffect(() => {
    const activeDomElement = document.querySelector('.mention-selected') as HTMLDivElement;
    if (activeDomElement) {
      safeScrollIntoViewIfNeeded(activeDomElement, true);
    }
  }, [activeItemIndex]);

  return <PagesList activeItemIndex={activeItemIndex} pages={filteredPages} onSelectPage={onSelectPage} />;
}

function sortList<T extends { title: string; originalTitle?: string }>({
  triggerText,
  list
}: {
  triggerText: string;
  list: T[];
}): T[] {
  return list
    .map((item) => ({
      item,
      similarity: stringSimilarity(item.originalTitle || item.title, triggerText)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .map(({ item }) => item);
}

export const LinkedPagesPopup = memo(_LinkedPagesPopup);
