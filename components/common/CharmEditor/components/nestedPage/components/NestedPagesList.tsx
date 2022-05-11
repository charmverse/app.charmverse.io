
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { Page } from 'models';
import { useCallback, memo } from 'react';
import useNestedPage from '../hooks/useNestedPage';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { NestedPagePluginKey, NestedPagePluginState } from '../nestedPage';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';
import { PagesList } from '../../PageList';

function NestedPagesList () {

  const { addNestedPage } = useNestedPage();

  const view = useEditorViewContext();

  const {
    tooltipContentDOM,
    show: isVisible
  } = usePluginState(NestedPagePluginKey) as NestedPagePluginState;

  function onClose () {
    hideSuggestionsTooltip(NestedPagePluginKey)(view.state, view.dispatch, view);
  }
  const onSelectPage = useCallback(
    (page: Page) => {
      addNestedPage(page.id);
      hideSuggestionsTooltip(NestedPagePluginKey)(view.state, view.dispatch, view);
    },
    [view]
  );

  return (
    <PopoverMenu container={tooltipContentDOM} isOpen={isVisible} onClose={onClose} width={460}>
      <GroupLabel>Select a page</GroupLabel>
      {isVisible && (
      <PagesList onSelectPage={onSelectPage} />
      )}
    </PopoverMenu>
  );
}

export default memo(NestedPagesList);
