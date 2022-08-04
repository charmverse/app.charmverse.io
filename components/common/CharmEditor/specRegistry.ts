import {
  bold,
  bulletList,
  code,
  hardBreak,
  heading,
  horizontalRule,
  italic,
  link,
  listItem,
  orderedList,
  strike,
  underline
} from '@bangle.dev/base-components';
import { SpecRegistry } from '@bangle.dev/core';
import { PageContent } from 'models';
import * as codeBlock from './components/@bangle.dev/base-components/code-block';
import * as columnLayout from './components/columnLayout';
import { cryptoPriceSpec } from './components/CryptoPrice';
import * as disclosure from './components/disclosure';
import * as iframe from './components/iframe';
import * as callout from './components/callout';
import { spec as inlinePaletteSpecs } from './components/inlinePalette';
import * as inlineVote from './components/inlineVote';
import { mentionSpecs } from './components/mention';
import * as inlineComment from './components/inlineComment';
import { nestedPageSpec } from './components/nestedPage';
import * as quote from './components/quote';
import { imageSpec } from './components/ResizableImage';
import { pdfSpec } from './components/ResizablePDF';
import * as emoji from './components/emojiSuggest';
import * as tabIndent from './components/tabIndent';
import * as table from './components/table';
import paragraph from './components/paragraph';

export interface ICharmEditorOutput {
  doc: PageContent,
  rawText: string
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
  disclosure.spec()
]);
