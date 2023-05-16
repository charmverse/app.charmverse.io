import { bold, code, hardBreak, italic, strike, underline } from '@bangle.dev/base-components';
import { SpecRegistry } from '@bangle.dev/core';

import type { PageContent } from 'lib/prosemirror/interfaces';

import * as codeBlock from './components/@bangle.dev/base-components/code-block';
import { spec as bookmarkSpec } from './components/bookmark/bookmarkSpec';
import * as bulletList from './components/bulletList';
import * as callout from './components/callout';
import * as columnLayout from './components/columnLayout';
import { cryptoPriceSpec } from './components/CryptoPrice';
import * as disclosure from './components/disclosure';
import * as doc from './components/doc';
import * as emoji from './components/emojiSuggest';
import { deletion, formatChange, insertion } from './components/fiduswriter/schema/common/track';
import { specs as fileSpecs } from './components/file/file.specs';
import * as heading from './components/heading';
import * as horizontalRule from './components/horizontalRule';
import * as iframe from './components/iframe';
import * as inlineComment from './components/inlineComment';
import * as inlineDatabase from './components/inlineDatabase';
import { spec as inlinePaletteSpecs } from './components/inlinePalette';
import * as inlineVote from './components/inlineVote';
import { spec as linkSpec } from './components/link/link.specs';
import * as listItem from './components/listItem/listItem';
import { mentionSpecs } from './components/mention';
import { nestedPageSpec } from './components/nestedPage';
import * as nft from './components/nft/nftSpec';
import * as orderedList from './components/orderedList';
import paragraph from './components/paragraph';
import * as poll from './components/poll/pollSpec';
import * as quote from './components/quote';
import * as image from './components/ResizableImage';
import { pdfSpec } from './components/ResizablePDF';
import * as tabIndent from './components/tabIndent';
import { spec as tableSpec } from './components/table/table';
import { spec as tableOfContentSpec } from './components/tableOfContents/tableOfContents.specs';
import * as textColor from './components/textColor/textColorSpec';
import * as tweet from './components/tweet/tweetSpec';
import * as video from './components/video/videoSpec';

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
  doc.spec(), // OK
  // MAKE SURE THIS IS ALWAYS AT THE TOP! Or deleting all contents will leave the wrong component in the editor
  paragraph.spec(), // OK
  mentionSpecs(), // NO
  inlineVote.spec(),
  bold.spec(), // OK
  bulletList.spec(), // OK
  hardBreak.spec(), // OK
  horizontalRule.spec(), // OK
  italic.spec(), // OK
  linkSpec(), // OK
  listItem.spec(), // OK
  orderedList.spec(), // OK
  strike.spec(), // OK
  underline.spec(), // OK
  emoji.specs(), // OK
  code.spec(), // OK
  codeBlock.spec(), // OK
  iframe.spec(), // OK
  tweet.spec(),
  heading.spec(), // OK
  inlinePaletteSpecs(), // Not required
  callout.spec(), // OK
  cryptoPriceSpec(), // NO
  pdfSpec(), // NO
  image.spec(), // OK
  columnLayout.rowSpec(), // NO
  columnLayout.columnSpec(), // NO
  nestedPageSpec(), // NO
  quote.spec(), // OK
  tabIndent.spec(),
  tableSpec(), // OK - only for text content
  disclosure.spec(),
  inlineDatabase.spec(),
  deletion,
  insertion,
  formatChange,
  // This should be below text format and track specs
  inlineComment.spec(),
  video.spec(),
  textColor.spec(),
  nft.spec(),
  poll.spec(),
  bookmarkSpec(),
  tableOfContentSpec(),
  fileSpecs()
]);
