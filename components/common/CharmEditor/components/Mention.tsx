import { NodeViewProps, RawSpecs, SpecRegistry } from '@bangle.dev/core';
import { Command, DOMOutputSpec, EditorState, Plugin, PluginKey, Schema } from '@bangle.dev/pm';
import { useEditorViewContext, usePluginState } from '@bangle.dev/react';
import { createTooltipDOM, SuggestTooltipRenderOpts } from '@bangle.dev/tooltip';
import { useTheme } from '@emotion/react';
import { Box, ClickAwayListener, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { ReviewerOption } from 'components/common/form/InputSearchContributor';
import { useContributors } from 'hooks/useContributors';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import { Contributor } from 'models';
import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { hideSuggestionsTooltip } from './@bangle.dev/tooltip/suggest-tooltip';
import * as suggestTooltip from './@bangle.dev/tooltip/suggest-tooltip';

const name = 'mention';

export const mentionSuggestKey = new PluginKey('mentionSuggestKey');
export const mentionSuggestMarkName = 'mentionSuggest';
export const mentionTrigger = '@';

function pluginsFactory ({
  key = new PluginKey('emojiSuggestMenu'),
  markName,
  tooltipRenderOpts = {}
}: {
  markName: string;
  key?: PluginKey;
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

export function mentionPlugins () {
  return pluginsFactory({
    key: mentionSuggestKey,
    markName: mentionSuggestMarkName,
    tooltipRenderOpts: {
      placement: 'bottom'
    }
  });
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

export function MentionSuggest () {
  const [contributors] = useContributors();
  const view = useEditorViewContext();
  const {
    tooltipContentDOM,
    suggestTooltipKey
  } = usePluginState(mentionSuggestKey);

  const {
    show: isVisible
  } = usePluginState(suggestTooltipKey);

  const theme = useTheme();

  const onSelectMention = useCallback(
    (value: string, type: string) => {
      selectMention(mentionSuggestKey, value, type)(view.state, view.dispatch, view);
      hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
    },
    [view, mentionSuggestKey]
  );

  if (isVisible) {
    return createPortal(
      <ClickAwayListener onClickAway={() => {
        hideSuggestionsTooltip(suggestTooltipKey)(view.state, view.dispatch, view);
      }}
      >
        <Box>
          {contributors.map(contributor => (
            <MenuItem
              sx={{
                background: theme.palette.background.light
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
        </Box>
      </ClickAwayListener>,
      tooltipContentDOM
    );
  }
  return null;
}

export function Mention ({ node }: NodeViewProps) {
  const theme = useTheme();
  const [contributors] = useContributors();
  const contributor = contributors.find(_contributor => _contributor.id === node.attrs.value)!;
  const ensName = useENSName(contributor?.addresses[0]);

  return contributor ? (
    <Box
      component='span'
      sx={{
        padding: theme.spacing(0.5, 1),
        borderRadius: theme.spacing(0.5),
        fontWeight: 600,
        opacity: 0.75,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75
      }}
    >
      <Typography sx={{
        fontSize: 12
      }}
      >
        @
        {ensName || getDisplayName(contributor)}
      </Typography>
    </Box>
  ) : null;
}
