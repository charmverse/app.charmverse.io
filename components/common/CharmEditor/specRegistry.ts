import {
  bold,
  code,
  hardBreak,
  italic,
  link,
  strike,
  underline
} from '@bangle.dev/base-components';
import { SpecRegistry } from '@bangle.dev/core';

import type { PageContent } from 'models';

import * as codeBlock from './components/@bangle.dev/base-components/code-block';
import * as bulletList from './components/bulletList';
import * as callout from './components/callout';
import * as columnLayout from './components/columnLayout';
import { cryptoPriceSpec } from './components/CryptoPrice';
import * as disclosure from './components/disclosure';
import * as emoji from './components/emojiSuggest';
import * as heading from './components/heading';
import * as horizontalRule from './components/horizontalRule';
import * as iframe from './components/iframe';
import * as inlineComment from './components/inlineComment';
import * as inlineDatabase from './components/inlineDatabase';
import { spec as inlinePaletteSpecs } from './components/inlinePalette';
import * as inlineVote from './components/inlineVote';
import * as listItem from './components/listItem/listItem';
import { mentionSpecs } from './components/mention';
import { nestedPageSpec } from './components/nestedPage';
import * as orderedList from './components/orderedList';
import paragraph from './components/paragraph';
import * as quote from './components/quote';
import { imageSpec } from './components/ResizableImage';
import { pdfSpec } from './components/ResizablePDF';
import {
  deletion,
  insertion,
  formatChange
} from './components/suggestions/schema/common/track';
import * as tabIndent from './components/tabIndent';
import * as table from './components/table';

export interface ICharmEditorOutput {
  doc: PageContent;
  rawText: string;
}

export const specRegistry = new SpecRegistry([
  // Comments to the right of each spec show if it supports markdown export
  // OK => Component exports markdown
  // ?? => Could not test component or identify it
  // NO => Not supported
  //
  // MAKE SURE THIS IS ALWAYS AT THE TOP! Or deleting all contents will leave the wrong component in the editor
  paragraph.spec(), // OK
  mentionSpecs(), // NO
  inlineComment.spec(),
  inlineVote.spec(),
  bold.spec(), // OK
  bulletList.spec(), // OK
  hardBreak.spec(), // OK
  horizontalRule.spec(), // OK
  italic.spec(), // OK
  link.spec(), // OK
  listItem.spec(), // OK
  orderedList.spec(), // OK
  strike.spec(), // OK
  underline.spec(), // OK
  emoji.specs(), // OK
  code.spec(), // OK
  codeBlock.spec(), // OK
  iframe.spec(), // OK
  heading.spec(), // OK
  inlinePaletteSpecs(), // Not required
  callout.spec(), // OK
  cryptoPriceSpec(), // NO
  pdfSpec(), // NO
  imageSpec(), // OK
  columnLayout.rowSpec(), // NO
  columnLayout.columnSpec(), // NO
  nestedPageSpec(), // NO
  quote.spec(), // OK
  tabIndent.spec(),
  table.spec(), // OK - only for text content
  disclosure.spec(),
  inlineDatabase.spec(),
  deletion,
  insertion,
  formatChange
]);
