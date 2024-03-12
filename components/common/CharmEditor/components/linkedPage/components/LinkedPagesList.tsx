import type { PageType } from '@charmverse/core/prisma';
import type { PluginKey } from 'prosemirror-state';
import { useCallback, memo, useEffect, useMemo } from 'react';

import { useEditorViewContext, usePluginState } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import type { PageListItem } from 'components/common/PagesList';
import { PagesList } from 'components/common/PagesList';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import { useForumCategories } from 'hooks/useForumCategories';
import { usePages } from 'hooks/usePages';
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

const linkablePageTypes: PageType[] = ['card', 'board', 'page', 'bounty', 'proposal', 'linked_board'];

function LinkedPagesList({ pluginKey }: { pluginKey: PluginKey<NestedPagePluginState> }) {
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
    [view]
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
  const { mappedFeatures, getFeatureTitle } = useSpaceFeatures();
  const { proposalTemplates } = useProposalTemplates();
  const debouncedTriggerText = useDebouncedValue(triggerText, 200);

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
  }, []);

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
      originalTitle: page.name,
      title: `Template > ${page.name}`,
      type: 'forum_category',
      icon: null
    }));
    const proposalPages: PageListItem[] = (proposalTemplates || []).map((template) => ({
      id: template.pageId,
      path: `/${template.pageId}`,
      hasContent: true,
      originalTitle: template.title,
      title: `Template > ${template.title}`,
      type: 'proposal_template',
      icon: null
    }));

    return [...userPages, ...categoryPages, ...staticPages, ...proposalPages];
  }, [categories, proposalTemplates, userPages, staticPages, getFeatureTitle]);

  const filteredPages = useMemo(() => {
    if (debouncedTriggerText) {
      return sortList({ triggerText: debouncedTriggerText, list: allPages });
    }
    return [...userPages, ...staticPages];
  }, [debouncedTriggerText, userPages, allPages, staticPages]);

  const totalItems = filteredPages.length;
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
    .filter(({ similarity }) => similarity >= 0.2)
    .sort((a, b) => b.similarity - a.similarity)
    .map(({ item }) => item);
}

export default memo(LinkedPagesList);
