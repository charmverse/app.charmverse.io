import { NodeViewProps, RawSpecs, SpecRegistry } from '@bangle.dev/core';
import { Command, DOMOutputSpec, EditorState, Plugin, PluginKey, Schema } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { createTooltipDOM, SuggestTooltipRenderOpts } from '@bangle.dev/tooltip';
import { useTheme } from '@emotion/react';
import { Box, ClickAwayListener, List, ListSubheader, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { ReviewerOption } from 'components/common/form/InputSearchContributor';
import { useContributors } from 'hooks/useContributors';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import { ReactNode, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { usePages } from 'hooks/usePages';
import PageIcon from 'components/common/PageLayout/components/PageIcon';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import Link from 'next/link';
import { hideSuggestionsTooltip } from './@bangle.dev/tooltip/suggest-tooltip';
import * as suggestTooltip from './@bangle.dev/tooltip/suggest-tooltip';
import { PagesList } from './PageList';

const name = 'mention';

export const mentionSuggestMarkName = 'mentionSuggest';
export const mentionTrigger = '@';

export function mentionPlugins ({
  key = new PluginKey('emojiSuggestMenu'),
  markName = mentionSuggestMarkName,
  tooltipRenderOpts = {}
}: {
  markName?: string;
  key: PluginKey;
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

/** Commands */
export function queryTriggerText (key: PluginKey) {
  return (state: EditorState) => {
    const suggestKey = getSuggestTooltipKey(key)(state);
    return suggestTooltip.queryTriggerText(suggestKey)(state);
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

function MentionSuggest ({ pluginKey }: {pluginKey: PluginKey}) {

  const { suggestTooltipKey } = usePluginState(pluginKey);

  const { show: isVisible } = usePluginState(suggestTooltipKey);

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

  const theme = useTheme();

  const onSelectMention = useCallback(
    (value: string, type: string) => {
      selectMention(pluginKey, value, type)(view.state, view.dispatch, view);
      hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
    },
    [view, pluginKey]
  );

  const contributorsList = (
    <>
      {contributors.map(contributor => (
        <MenuItem
          component='div'
          sx={{
            background: theme.palette.background.dark
          }}
          onClick={() => onSelectMention(contributor.id, 'user')}
          key={contributor.id}
        >
          <ReviewerOption
            style={{
              alignItems: 'center'
            }}
            user={contributor}
            avatarSize='small'
          />
        </MenuItem>
      ))}
    </>
  );

  return createPortal(
    <ClickAwayListener onClickAway={() => {
      hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
    }}
    >
      <List
        sx={{
          width: '350px',
          position: 'relative',
          overflow: 'auto',
          maxHeight: 300,
          '& ul': { padding: 0 }
        }}
        subheader={<li />}
      >
        {['Contributors', 'Pages'].map(sectionId => {
          return (
            <Box
              key={`section-${sectionId}`}
              sx={{
                // This is required to not show the background while scrolling
                backgroundColor: theme.palette.background.dark
              }}
            >
              <ListSubheader sx={{
                top: '-5px',
                zIndex: 25
              }}
              >{sectionId}
              </ListSubheader>
              {sectionId === 'Contributors' ? contributorsList : <PagesList onSelectPage={(page) => onSelectMention(page.id, 'page')} />}
              <hr style={{
                height: 2,
                marginTop: '8px',
                marginBottom: 0
              }}
              />
            </Box>
          );
        })}
      </List>
    </ClickAwayListener>,
    tooltipContentDOM
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
        <PageIcon icon={page.icon} isEditorEmpty={false} pageType={page.type} />
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
