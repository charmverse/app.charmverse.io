import { NodeViewProps, RawSpecs, SpecRegistry } from '@bangle.dev/core';
import { Command, DOMOutputSpec, EditorState, Plugin, PluginKey, Schema } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { createTooltipDOM, SuggestTooltipRenderOpts } from '@bangle.dev/tooltip';
import { useTheme } from '@emotion/react';
import { Box, Divider, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { useContributors } from 'hooks/useContributors';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import { ReactNode, useCallback, memo, useEffect } from 'react';
import { usePages } from 'hooks/usePages';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import Link from 'next/link';
import { ReviewerOption } from 'components/common/form/InputSearchContributor';
import { Page } from '@prisma/client';
import { safeScrollIntoViewIfNeeded } from 'lib/browser';
import { PageContent } from 'models';
import { hideSuggestionsTooltip, SuggestTooltipPluginState } from './@bangle.dev/tooltip/suggest-tooltip';
import * as suggestTooltip from './@bangle.dev/tooltip/suggest-tooltip';
import { PagesList } from './PageList';
import PopoverMenu, { GroupLabel } from './PopoverMenu';
import { checkForEmpty } from '../utils';

const name = 'mention';

export const mentionSuggestMarkName = 'mentionSuggest';
export const mentionTrigger = '@';

export interface MentionPluginState {
  tooltipContentDOM: HTMLElement
  markName: string
  suggestTooltipKey: PluginKey<SuggestTooltipPluginState>
}

export function mentionPlugins ({
  key = new PluginKey<MentionPluginState>('emojiSuggestMenu'),
  markName = mentionSuggestMarkName,
  tooltipRenderOpts = {
    placement: 'bottom-start'
  }
}: {
  markName?: string;
  key: PluginKey<MentionPluginState>;
  tooltipRenderOpts?: SuggestTooltipRenderOpts;
}) {
  return ({
    specRegistry
  }: {
    schema: Schema;
    specRegistry: SpecRegistry;
  }) => {
    const { trigger } = specRegistry.options[markName as any] as any;

    const suggestTooltipKey = new PluginKey('suggestTooltipKey');

    // We are converting to DOM elements so that their instances
    // can be shared across plugins.
    const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);

    return [
      new Plugin({
        key,
        state: {
          init () {
            return {
              tooltipContentDOM: tooltipDOMSpec.contentDOM,
              markName,
              suggestTooltipKey
            };
          },
          apply (_, pluginState) {
            return pluginState;
          }
        }
      }),
      suggestTooltip.plugins({
        key: suggestTooltipKey,
        markName,
        trigger,
        onEnter (state, dispatch, view) {
          const selectedMenuItem = document.querySelector('.mention-selected');
          const value = selectedMenuItem?.getAttribute('data-value');
          const type = selectedMenuItem?.getAttribute('data-type');
          if (value && type && view) {
            return selectMention(key, value, type)(state, dispatch, view);
          }
          return false;
        },
        tooltipRenderOpts: {
          ...tooltipRenderOpts,
          tooltipDOMSpec
        }
      })
    ];
  };
}

export function getSuggestTooltipKey (key: PluginKey) {
  return (state: EditorState) => {
    return key.getState(state).suggestTooltipKey as PluginKey;
  };
}

export function mentionSpecs (): RawSpecs {
  const spec = suggestTooltip.spec({ markName: mentionSuggestMarkName, trigger: mentionTrigger });
  return [
    {
      type: 'node',
      name,
      schema: {
        attrs: {
          value: {
            default: null
          },
          type: {
            default: 'user'
          }
        },
        inline: true,
        group: 'inline',
        draggable: true,
        atom: true,
        parseDOM: [{ tag: 'span.charm-mention-value' }],
        toDOM: (): DOMOutputSpec => {
          return ['span', { class: 'charm-mention-value' }];
        }
      },
      markdown: {
        toMarkdown: () => undefined
      }
    },
    {
      ...spec,
      options: {
        trigger: mentionTrigger
      }
    }
  ];
}

export function selectMention (key: PluginKey, mentionValue: string, mentionType: string): Command {
  return (state, dispatch, view) => {
    const mentionNode = state.schema.nodes.mention.create({
      value: mentionValue,
      type: mentionType
    });
    const suggestKey = getSuggestTooltipKey(key)(state);
    return suggestTooltip.replaceSuggestMarkWith(suggestKey, mentionNode)(
      state,
      dispatch,
      view
    );
  };
}

function MentionSuggest ({ pluginKey }: {pluginKey: PluginKey<MentionPluginState>}) {
  const { suggestTooltipKey } = usePluginState(pluginKey) as MentionPluginState;

  const { show: isVisible } = usePluginState(suggestTooltipKey) as SuggestTooltipPluginState;

  if (isVisible) {
    return <MentionSuggestMenu pluginKey={pluginKey} />;
  }
  return null;
}

function MentionSuggestMenu ({ pluginKey }: {pluginKey: PluginKey}) {
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
      isOpen={isVisible}
      onClose={() => {
        hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
      }}
      width={350}
    >
      <Box
        sx={{
          overflow: 'auto',
          maxHeight: 300,
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
                  <ReviewerOption
                    style={{
                      alignItems: 'center'
                    }}
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

export function Mention ({ node }: NodeViewProps) {
  const attrs = node.attrs as {value: string, type: 'user' | 'page'};
  const theme = useTheme();
  const [contributors] = useContributors();
  const { pages } = usePages();
  const contributor = contributors.find(_contributor => _contributor.id === attrs.value);
  const ensName = useENSName(contributor?.addresses[0]);
  const [space] = useCurrentSpace();
  let value: ReactNode = null;
  if (attrs.type === 'page') {
    const page = pages[attrs.value];
    value = page && (
    <Link
      href={`/${space?.domain}/${page.path}`}
      passHref
    >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        top: 5,
        cursor: 'pointer'
      }}
      >
        <PageIcon icon={page.icon} isEditorEmpty={checkForEmpty(page.content as PageContent)} pageType={page.type} />
        <div>{page.title || 'Untitled'}</div>
      </Box>
    </Link>
    );
  }
  else if (attrs.type === 'user') {
    value = (
      <Typography sx={{
        fontSize: 12
      }}
      >
        @
        {ensName || getDisplayName(contributor)}
      </Typography>
    );
  }

  return value ? (
    <Box
      component='span'
      sx={{
        padding: theme.spacing(0, 0.5),
        borderRadius: theme.spacing(0.5),
        fontWeight: 600,
        opacity: 0.75,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        fontSize: '14px'
      }}
    >
      {value}
    </Box>
  ) : null;
}
