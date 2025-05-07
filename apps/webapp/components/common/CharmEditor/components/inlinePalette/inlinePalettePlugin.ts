import { valuePlugin } from '@bangle.dev/utils';
import { log } from '@charmverse/core/log';
import { keymap } from 'prosemirror-keymap';
import type { Schema } from 'prosemirror-model';
import type { Command } from 'prosemirror-state';
import { PluginKey } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { keybindings } from '../../keybindings';
import { safeRequestAnimationFrame } from '../../utils';
import type { SpecRegistry } from '../@bangle.dev/core/specRegistry';
import { createTooltipDOM } from '../@bangle.dev/tooltip/createTooltipDOM';
import { plugins as suggestTooltipPlugins } from '../@bangle.dev/tooltip/suggestTooltipPlugin';
import type { SuggestTooltipRenderOpts } from '../@bangle.dev/tooltip/suggestTooltipPlugin';
import {
  decrementSuggestTooltipCounter,
  incrementSuggestTooltipCounter
} from '../@bangle.dev/tooltip/suggestTooltipSpec';

import { paletteMarkName } from './config';
import { queryInlinePaletteActive } from './inlinePalette';

export function plugins({ key }: { key: PluginKey }) {
  const markName = paletteMarkName;
  const tooltipRenderOpts: SuggestTooltipRenderOpts = {
    getScrollContainer,
    placement: 'bottom-start'
  };

  return ({ schema, specRegistry }: { schema: Schema; specRegistry: SpecRegistry }) => {
    const { trigger: _trigger } = specRegistry.options[markName];
    const suggestTooltipKey = new PluginKey('inlinePaletteTooltipKey');

    // We are converting to DOM elements so that their instances
    // can be shared across plugins.
    const tooltipDOMSpec = createTooltipDOM();

    if (!schema.marks[markName]) {
      log.warn(
        `Couldn't find the markName: ${markName}, please make sure you have initialized to use the same markName you initialized the spec with`
      );
      throw new Error(`markName ${markName} not found`);
    }

    const updateCounter: any = (_key = 'UP'): Command => {
      return (state, dispatch, view) => {
        safeRequestAnimationFrame(() => {
          view?.focus();
        });
        if (_key === 'UP') {
          return decrementSuggestTooltipCounter(suggestTooltipKey)(state, dispatch, view);
        } else {
          return incrementSuggestTooltipCounter(suggestTooltipKey)(state, dispatch, view);
        }
      };
    };

    let executeItemCommand: Command;
    return [
      valuePlugin(key, {
        // We are setting this callback which returns us the
        // the currently active item (the one that executes when enter is pressed)
        // this is here because this is the only way I could think of passing
        // data from a react component to plugin. Note it will not trigger
        // any update or anything - dont confuse it will setState in react.
        // its a simple swap of a closure variable which the enter handler
        // can then use if pressed.
        setExecuteItemCommand: (command: Command) => {
          executeItemCommand = command;
        },
        tooltipContentDOM: tooltipDOMSpec.contentDOM,
        markName,
        suggestTooltipKey
      }),
      suggestTooltipPlugins({
        key: suggestTooltipKey,
        markName,
        trigger: _trigger,
        tooltipRenderOpts: {
          ...tooltipRenderOpts,
          tooltipDOMSpec
        },
        onEnter: (state, dispatch, view) => {
          return executeItemCommand?.(state, dispatch, view);
        },
        onArrowDown: updateCounter('DOWN'),
        onArrowUp: updateCounter('UP')
      }),

      keymap({
        [keybindings.toggleInlineCommandPalette.key]: (state, dispatch): boolean => {
          const { tr, schema: _schema, selection } = state;

          if (queryInlinePaletteActive(key)(state)) {
            return false;
          }
          const marks = selection.$from.marks();
          const mark = _schema.mark(paletteMarkName, { trigger: _trigger });
          const textBefore = selection.$from.nodeBefore?.text;
          // Insert a space so we follow the convention of <space> trigger
          if (textBefore && !textBefore.endsWith(' ')) {
            tr.replaceSelectionWith(_schema.text(' '), false);
          }
          tr.replaceSelectionWith(_schema.text(_trigger, [mark, ...marks]), false);
          dispatch?.(tr);
          return true;
        }
      })
    ];
  };
}

function getScrollContainer(view: EditorView) {
  return view.dom.parentElement!;
}
