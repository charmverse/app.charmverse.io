import { blockquote } from '@bangle.dev/base-components';
import { chainCommands } from '@bangle.dev/pm';

import * as heading from '../heading';
import * as listItem from '../listItemNew/commands';
import paragraph from '../paragraph';

const { insertEmptyParagraphAbove, insertEmptyParagraphBelow } = paragraph;
const { queryIsBulletListActive, queryIsOrderedListActive } = listItem;
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
