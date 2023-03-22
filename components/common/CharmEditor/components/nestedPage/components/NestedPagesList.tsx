import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import type { PageType } from '@prisma/client';
import type { PluginKey } from 'prosemirror-state';
import { useCallback, memo, useEffect, useMemo } from 'react';

import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import { useForumCategories } from 'hooks/useForumCategories';
import { usePages } from 'hooks/usePages';
import { insertNestedPage } from 'lib/prosemirror/insertNestedPage';
import { safeScrollIntoViewIfNeeded } from 'lib/utilities/browser';
import { isTruthy } from 'lib/utilities/types';

import type { PluginState as SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import PagesList from '../../PageList';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';
import type { NestedPagePluginState } from '../nestedPage.interfaces';

const linkablePageTypes: PageType[] = ['card', 'board', 'page', 'bounty', 'proposal', 'linked_board'];

function NestedPagesList({ pluginKey }: { pluginKey: PluginKey<NestedPagePluginState> }) {
  const { pages } = usePages();
  const { categories } = useForumCategories();
  const view = useEditorViewContext();
  const { tooltipContentDOM, suggestTooltipKey } = usePluginState(pluginKey) as NestedPagePluginState;
  const { triggerText, counter, show: isVisible } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;

  function onClose() {
    hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
  }

  const listPages = useMemo(
    () =>
      Object.values(pages)
        .filter(isTruthy)
        .filter((page) => page.deletedAt === null && linkablePageTypes.includes(page.type)),
    [pages]
  );

  const filteredPages = useMemo(() => {
    if (!triggerText) {
      return listPages.filter((page) => !page?.parentId);
    }

    return listPages.filter((page) =>
      triggerText.length !== 0
        ? (page.title || 'Untitled').toLowerCase().startsWith(triggerText.toLowerCase().trim())
        : true
    );
  }, [triggerText, listPages]);

  const filteredStaticPages = useMemo(
    () =>
      STATIC_PAGES.filter((page) =>
        triggerText.length > 0 ? page.title.toLowerCase().startsWith(triggerText.toLowerCase().trim()) : true
      ),
    [triggerText]
  );

  const filteredForumCategories = useMemo(() => {
    if (triggerText) {
      return categories.filter((page) =>
        triggerText.length > 0 ? page.name.toLowerCase().startsWith(triggerText.toLowerCase().trim()) : true
      );
    }

    return [];
  }, [triggerText, categories]);

  const totalItems = filteredPages.length;
  const activeItemIndex = (counter < 0 ? (counter % totalItems) + totalItems : counter) % totalItems;

  const onSelectPage = useCallback(
    (pageId: string) => {
      insertNestedPage(pluginKey, view, pageId);
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
      <PagesList
        activeItemIndex={activeItemIndex}
        pages={filteredPages}
        staticPages={filteredStaticPages}
        forumCategories={filteredForumCategories}
        onSelectPage={onSelectPage}
      />
    </PopoverMenu>
  );
}

export default memo(NestedPagesList);
