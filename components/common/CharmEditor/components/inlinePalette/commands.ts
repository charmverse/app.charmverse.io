import { blockquote } from '@bangle.dev/base-components';
import { commands as listItemCommands } from '@packages/charmeditor/extensions/listItem';
import { chainCommands } from 'prosemirror-commands';

import * as heading from '../heading';
import { insertEmptyParagraphAbove, insertEmptyParagraphBelow } from '../paragraph/paragraph';

const { queryIsBulletListActive, queryIsOrderedListActive } = listItemCommands;
const { insertEmptyParaAbove: headingInsertEmptyParaAbove, insertEmptyParaBelow: headingInsertEmptyParaBelow } =
  heading;

const { insertEmptyParaAbove: blockquoteInsertEmptyParaAbove, insertEmptyParaBelow: blockquoteInsertEmptyParaBelow } =
  blockquote;

export function chainedInsertParagraphAbove() {
  return chainCommands(insertEmptyParagraphAbove(), headingInsertEmptyParaAbove(), blockquoteInsertEmptyParaAbove());
}

export function chainedInsertParagraphBelow() {
  return chainCommands(insertEmptyParagraphBelow(), headingInsertEmptyParaBelow(), blockquoteInsertEmptyParaBelow());
}

export function isList() {
  return chainCommands(queryIsOrderedListActive(), queryIsBulletListActive());
}
