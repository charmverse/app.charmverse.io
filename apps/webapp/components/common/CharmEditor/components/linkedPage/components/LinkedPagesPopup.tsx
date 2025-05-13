import { hideSuggestionsTooltip } from '@packages/bangleeditor/components/@bangle.dev/tooltip/suggestTooltipSpec';
import { STATIC_PAGES } from '@packages/features/constants';
import { safeScrollIntoViewIfNeeded } from '@packages/lib/utils/browser';
import type { PluginKey } from 'prosemirror-state';
import { useCallback, memo, useEffect, useMemo, useState } from 'react';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import type { PageListItem } from 'components/common/PagesList';
import { PagesList } from 'components/common/PagesList';
import { useForumCategories } from 'hooks/useForumCategories';
import { useRootPages } from 'hooks/useRootPages';
import { useSearchPages, sortList } from 'hooks/useSearchPages';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { insertLinkedPage } from 'lib/prosemirror/insertLinkedPage';

import type { PluginState as SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggestTooltipPlugin';
import type { NestedPagePluginState } from '../../nestedPage/nestedPage.interfaces';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';

// not sure why we needed to filter this list, leaving it for now - Mar, 2024
// const linkablePageTypes: PageType[] = ['card', 'board', 'page', 'bounty', 'proposal', 'linked_board'];

function _LinkedPagesPopup({ pluginKey, pageId }: { pluginKey: PluginKey<NestedPagePluginState>; pageId?: string }) {
  const view = useEditorViewContext();
  const { tooltipContentDOM, suggestTooltipKey } = usePluginState(pluginKey) as NestedPagePluginState;
  const { triggerText, counter, show: isVisible } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;

  function onClose() {
    hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
  }

  const onSelectPage = useCallback(
    (_pageId: string, type: PageListItem['type'], path: string) => {
      insertLinkedPage(pluginKey, view, _pageId, type, path);
    },
    [view, pluginKey]
  );

  return (
    <PopoverMenu container={tooltipContentDOM} isOpen={isVisible} onClose={onClose} width={460}>
      <GroupLabel>Select a page</GroupLabel>
      <PagesMenu counter={counter} triggerText={triggerText} pageId={pageId} onSelectPage={onSelectPage} />
    </PopoverMenu>
  );
}
function PagesMenu({
  counter,
  triggerText,
  onSelectPage,
  pageId
}: {
  counter: number;
  triggerText: string;
  pageId?: string;
  onSelectPage: (pageId: string, type: PageListItem['type'], path: string) => void;
}) {
  const { rootPages } = useRootPages();
  const { categories } = useForumCategories();
  const { mappedFeatures } = useSpaceFeatures();
  const { results: searchResults, isLoading } = useSearchPages({ search: triggerText, limit: 50 });
  // keep track of static results, only update if isLoading is false
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
      .map((option) => ({
        id: option.id,
        path: option.path || '',
        hasContent: true,
        originalTitle: option.name,
        title: `Category > ${option.name}`,
        type: 'forum_category',
        icon: null
      }));
  }, [categories, triggerText]);

  useEffect(() => {
    // to reduce jumping, dont update results if we are waiting for a response from the backend
    if (!isLoading) {
      const filteredStaticPages = staticPages.filter((option) => {
        return option.title.toLowerCase().includes(triggerText.toLowerCase());
      });
      setFilteredPages(
        // sort pages with static and category
        sortList({
          triggerText,
          list: [
            // filter out this page
            ...searchResults.filter((r) => r.id !== pageId),
            ...filteredStaticPages,
            ...filteredCategoryPages
          ]
        })
      );
    }
  }, [isLoading, pageId, triggerText, searchResults, staticPages, filteredCategoryPages]);

  const options = useMemo(() => {
    if (triggerText) {
      return filteredPages;
    }
    // show default list (root pages from sidebar)
    return [...staticPages, ...rootPages];
  }, [triggerText, rootPages, filteredPages, staticPages]);

  const totalItems = options.length;
  const activeItemIndex = (counter < 0 ? (counter % totalItems) + totalItems : counter) % totalItems;

  useEffect(() => {
    const activeDomElement = document.querySelector('.mention-selected') as HTMLDivElement;
    if (activeDomElement) {
      safeScrollIntoViewIfNeeded(activeDomElement, true);
    }
  }, [activeItemIndex]);

  return <PagesList activeItemIndex={activeItemIndex} pages={options} onSelectPage={onSelectPage} />;
}

export const LinkedPagesPopup = memo(_LinkedPagesPopup);
