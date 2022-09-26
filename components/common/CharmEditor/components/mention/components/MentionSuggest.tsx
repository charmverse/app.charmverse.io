import { usePluginState, useEditorViewContext } from '@bangle.dev/react';
import { Typography, Divider, MenuItem } from '@mui/material';
import { Box } from '@mui/system';
import type { Page } from '@prisma/client';
import UserDisplay from 'components/common/UserDisplay';
import { useContributors } from 'hooks/useContributors';
import { usePages } from 'hooks/usePages';
import { safeScrollIntoViewIfNeeded } from 'lib/browser';
import type { PluginKey } from 'prosemirror-state';
import { useCallback, useEffect, memo } from 'react';
import type { SuggestTooltipPluginState } from '../../@bangle.dev/tooltip/suggest-tooltip';
import { hideSuggestionsTooltip } from '../../@bangle.dev/tooltip/suggest-tooltip';
import PagesList from '../../PageList';
import PopoverMenu, { GroupLabel } from '../../PopoverMenu';
import type { MentionPluginState } from '../mention.interfaces';
import { selectMention } from '../mention.utils';

export function MentionSuggest ({ pluginKey }: {pluginKey: PluginKey<MentionPluginState>;}) {
  const { suggestTooltipKey } = usePluginState(pluginKey) as MentionPluginState;
  const { show: isVisible } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;
  if (isVisible) {
    return <MentionSuggestMenu pluginKey={pluginKey} />;
  }
  return null;
}

function MentionSuggestMenu ({ pluginKey }: {pluginKey: PluginKey;}) {
  const [contributors] = useContributors();
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    suggestTooltipKey
  } = usePluginState(pluginKey);
  const { show: isVisible, triggerText, counter } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;
  const { pages } = usePages();
  const onSelectMention = useCallback(
    (value: string, type: string) => {
      selectMention(pluginKey, value, type)(view.state, view.dispatch, view);
      hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
    },
    [view, pluginKey]
  );

  const filteredContributors = triggerText.length !== 0 ? contributors.filter(
    contributor => (
      contributor.username?.toLowerCase()?.startsWith(triggerText.toLowerCase()))
  ) : contributors;

  const filteredPages = (Object.values(pages).filter((page) => page && page?.deletedAt === null && (triggerText.length !== 0 ? (page.title || 'Untitled').toLowerCase().startsWith(triggerText.toLowerCase()) : true)));
  const totalItems = (filteredContributors.length + filteredPages.length);
  const roundedCounter = ((counter < 0 ? ((counter % totalItems) + totalItems) : counter) % totalItems);
  const selectedGroup = roundedCounter < filteredContributors.length ? 'contributors' : 'pages';
  const activeItemIndex = selectedGroup === 'contributors' ? roundedCounter : roundedCounter - filteredContributors.length;

  useEffect(() => {
    const activeDomElement = document.querySelector('.mention-selected') as HTMLDivElement;
    if (activeDomElement) {
      safeScrollIntoViewIfNeeded(activeDomElement, true);
    }
  }, [activeItemIndex]);
  return (
    <PopoverMenu
      container={tooltipContentDOM}
      maxHeight='300px'
      isOpen={isVisible}
      onClose={() => {
        hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
      }}
      width={350}
    >
      <Box
        sx={{
          py: 1
        }}
      >
        <GroupLabel>Contributors</GroupLabel>
        {filteredContributors.length === 0 ? <Typography sx={{ ml: 2 }} variant='subtitle2' color='secondary'>No contributors found</Typography> : (
          <div>
            {filteredContributors.map((contributor, contributorIndex) => {
              const isSelected = selectedGroup === 'contributors' ? activeItemIndex === contributorIndex : false;
              return (
                <MenuItem
                  component='div'
                  onClick={() => onSelectMention(contributor.id, 'user')}
                  key={contributor.id}
                  selected={isSelected}
                  data-value={contributor.id}
                  data-type='user'
                  className={isSelected ? 'mention-selected' : ''}
                >
                  <UserDisplay
                    fontSize={14}
                    user={contributor}
                    avatarSize='small'
                  />
                </MenuItem>
              );
            })}
          </div>
        )}
        <Divider sx={{
          my: 1
        }}
        />
        <GroupLabel>Pages</GroupLabel>
        <PagesList activeItemIndex={selectedGroup === 'pages' ? activeItemIndex : -1} pages={filteredPages as Page[]} onSelectPage={(page) => onSelectMention(page.id, 'page')} />
      </Box>
    </PopoverMenu>
  );
}

export default memo(MentionSuggest);
