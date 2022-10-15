
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import type { PluginKey } from 'prosemirror-state';
import { useCallback, memo, useEffect } from 'react';

import { usePages } from 'hooks/usePages';
import type { PageMeta } from 'lib/pages';
import { insertNestedPage } from 'lib/prosemirror/insertNestedPage';
import { safeScrollIntoViewIfNeeded } from 'lib/utilities/browser';

import type { SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import PagesList from '../../PageList';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';
import type { NestedPagePluginState } from '../nestedPage.interfaces';

function NestedPagesList ({ pluginKey }: { pluginKey: PluginKey<NestedPagePluginState> }) {
  const { pages } = usePages();
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    suggestTooltipKey
  } = usePluginState(pluginKey) as NestedPagePluginState;
  const { triggerText, counter, show: isVisible } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;
  function onClose () {
    hideSuggestionsTooltip(pluginKey)(view.state, view.dispatch, view);
  }

  const filteredPages = (Object.values(pages).filter((page) => page && page?.deletedAt === null && (triggerText.length !== 0 ? (page.title || 'Untitled').toLowerCase().startsWith(triggerText.toLowerCase().trim()) : true)));
  const totalItems = filteredPages.length;
  const activeItemIndex = ((counter < 0 ? ((counter % totalItems) + totalItems) : counter) % totalItems);

  const onSelectPage = useCallback(
    (page: PageMeta) => {
      insertNestedPage(pluginKey, view, page.id);
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
      <PagesList activeItemIndex={activeItemIndex} pages={filteredPages as PageMeta[]} onSelectPage={onSelectPage} />
    </PopoverMenu>
  );
}

export default memo(NestedPagesList);
