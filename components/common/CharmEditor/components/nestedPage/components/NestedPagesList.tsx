
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import type { Page } from 'models';
import { useCallback, memo, useEffect } from 'react';
import { usePages } from 'hooks/usePages';
import type { PluginKey } from 'prosemirror-state';
import { safeScrollIntoViewIfNeeded } from 'lib/browser';
import { insertNestedPage } from 'lib/prosemirror/insertNestedPage';
import type { SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';
import PagesList from '../../PageList';
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
    (page: Page) => {
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
      <PagesList activeItemIndex={activeItemIndex} pages={filteredPages as Page[]} onSelectPage={onSelectPage} />
    </PopoverMenu>
  );
}

export default memo(NestedPagesList);
