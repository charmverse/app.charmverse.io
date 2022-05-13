
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { Page } from 'models';
import { useCallback, memo, useEffect } from 'react';
import { usePages } from 'hooks/usePages';
import { PluginKey } from 'prosemirror-state';
import { safeScrollIntoViewIfNeeded } from 'lib/browser';
import useNestedPage from '../hooks/useNestedPage';
import { hideSuggestionsTooltip, SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { NestedPagePluginState } from '../nestedPage';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';
import { PagesList } from '../../PageList';

function NestedPagesList ({ pluginKey }: {pluginKey: PluginKey<NestedPagePluginState>}) {
  const { addNestedPage } = useNestedPage();
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
  const filteredPages = (Object.values(pages).filter((page) => page && page?.deletedAt === null && (triggerText.length !== 0 ? (page.title || 'Untitled').toLowerCase().startsWith(triggerText.toLowerCase()) : true)));
  const totalItems = filteredPages.length;
  const activeItemIndex = ((counter < 0 ? ((counter % totalItems) + totalItems) : counter) % totalItems);

  const onSelectPage = useCallback(
    (page: Page) => {
      addNestedPage(page.id);
      hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
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
