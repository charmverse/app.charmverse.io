import { log as _log } from '@packages/core/log';
import type {
  Instance as PopperInstance,
  Modifier,
  Placement,
  State as PopperState,
  VirtualElement
} from '@popperjs/core';
import type { DOMOutputSpec } from 'prosemirror-model';
import type { EditorState, PluginKey } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { createTooltipDOM } from './createTooltipDOM';
import { arrow, createPopper, flip, offset, popperOffsets, preventOverflow } from './popper';

export const plugins = tooltipPlacement;

const LOG = false;
const log = LOG ? _log.debug : () => {};

const rem = typeof window === 'undefined' ? 12 : parseFloat(getComputedStyle(document.documentElement).fontSize);

type TooltipPluginState = {
  show: boolean;
};

type TooltipCallbackFunction = (state: EditorState, dispatch: any, view: EditorView) => any;

type ModifierList = Modifier<any, any>[];

export type GetReferenceElementFunction = (
  view: EditorView,
  tooltipDOM: HTMLElement,
  scrollContainerDOM: HTMLElement
) => VirtualElement;

export type TooltipRenderOpts = {
  tooltipDOMSpec?: DOMOutputSpec;
  placement?: Placement;
  getReferenceElement: GetReferenceElementFunction;
  getScrollContainer?: (view: EditorView) => HTMLElement;
  onUpdateTooltip?: TooltipCallbackFunction;
  onHideTooltip?: TooltipCallbackFunction;
  tooltipOffset?: (state: PopperState) => [number, number];
  fallbackPlacements?: [Placement, Placement];
  customPopperModifiers?: (
    view: EditorView,
    tooltipDOM: HTMLElement,
    scrollContainerDOM: HTMLElement,
    defaultModifiers: ModifierList
  ) => ModifierList;
};

type TooltipPlacementOptions = {
  stateKey: PluginKey;
  renderOpts: TooltipRenderOpts;
};

function tooltipPlacement({
  stateKey,
  renderOpts: {
    tooltipDOMSpec,
    placement = 'top',
    getReferenceElement,
    getScrollContainer = (view) => {
      return view.dom.parentElement!;
    },
    onUpdateTooltip = (_state, _dispatch, _view) => {},
    onHideTooltip = (_state, _dispatch, _view) => {},
    tooltipOffset = () => {
      return [0, 0.5 * rem];
    },
    fallbackPlacements = ['bottom', 'top'],
    customPopperModifiers
  }
}: TooltipPlacementOptions) {
  class TooltipPlacementView {
    popperInstance: PopperInstance | null = null;

    _scrollContainerDOM: HTMLElement;

    _tooltip: HTMLElement;

    _view: EditorView;

    constructor(view: EditorView) {
      this._view = view;

      const { dom: tooltipDOM } = createTooltipDOM(tooltipDOMSpec);

      this._tooltip = tooltipDOM;
      this._scrollContainerDOM = getScrollContainer(view);
      // TODO should this be this plugins responsibility
      this._view.dom.parentNode!.appendChild(this._tooltip);

      const pluginState: TooltipPluginState = stateKey.getState(view.state);
      validateState(pluginState);
      // if the initial state is to show, setup the tooltip
      if (pluginState.show) {
        this._showTooltip();
      }
    }

    destroy() {
      if (this.popperInstance) {
        this.popperInstance.destroy();
        this.popperInstance = null;
      }

      this._view.dom.parentNode!.removeChild(this._tooltip);
    }

    update(view: EditorView, prevState: EditorState) {
      const pluginState = stateKey.getState(view.state);
      if (pluginState === stateKey.getState(prevState)) {
        return;
      }
      if (pluginState.show) {
        log('calling update toolip');
        onUpdateTooltip.call(this, view.state, view.dispatch, view);

        this._showTooltip();
      } else {
        log('calling hide tooltip');
        this._hideTooltip();
      }
    }

    _createPopperInstance(view: EditorView) {
      if (this.popperInstance) {
        return;
      }

      const showTooltipArrow = this._tooltip.querySelector('[data-popper-arrow]');
      const defaultModifiers = [
        offset,
        preventOverflow,
        flip,
        {
          name: 'offset',
          options: {
            offset: (popperState: PopperState) => {
              return tooltipOffset(popperState);
            }
          }
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements,
            padding: 10
          }
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: this._scrollContainerDOM
          }
        },
        popperOffsets,
        showTooltipArrow ? arrow : undefined,
        showTooltipArrow
          ? {
              name: 'arrow',
              options: {
                element: showTooltipArrow
              }
            }
          : undefined
      ].filter(Boolean) as ModifierList;

      this.popperInstance = createPopper(
        getReferenceElement(view, this._tooltip, this._scrollContainerDOM),
        this._tooltip,
        {
          placement,
          modifiers: customPopperModifiers
            ? customPopperModifiers(view, this._tooltip, this._scrollContainerDOM, defaultModifiers)
            : defaultModifiers
        }
      );
      onUpdateTooltip.call(this, view.state, view.dispatch, view);
    }

    _hideTooltip() {
      log('hiding');
      if (this.popperInstance) {
        this._tooltip.removeAttribute('data-show');
        this.popperInstance.destroy();
        this.popperInstance = null;
        onHideTooltip.call(this, this._view.state, this._view.dispatch, this._view);
      }
    }

    _showTooltip() {
      this._tooltip.setAttribute('data-show', '');
      this._createPopperInstance(this._view);
      this.popperInstance!.update();
    }
  }

  return new Plugin({
    view: (view: EditorView) => {
      return new TooltipPlacementView(view);
    }
  });
}

function validateState(state: TooltipPluginState) {
  if (typeof state.show !== 'boolean') {
    log(
      `Tooltip must be controlled by a plugin having a boolean field "show" in its state, but received the state=`,
      state
    );
    throw new Error('"show" field required.');
  }
}
