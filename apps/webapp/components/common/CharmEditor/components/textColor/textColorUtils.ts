import { getMarkAttrs } from '@bangle.dev/utils';
import type { EditorState } from 'prosemirror-state';

import type { BrandColor } from 'theme/colors';
import { colors } from 'theme/colors';

import type { TextColorAttrs } from './config';
import { markName } from './config';

export function getCSSColor(type: 'bg' | 'text', color: string) {
  return colors[color as BrandColor] ? `var(--${type}-${color})` : undefined;
}

export function queryActiveColor() {
  return (state: EditorState) => {
    const markType = state.schema.marks[markName];
    const attrs = getMarkAttrs(state, markType) as TextColorAttrs;
    return attrs.bgColor || attrs.color ? attrs : null;
  };
}
