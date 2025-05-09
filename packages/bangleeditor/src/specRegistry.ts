import { bold, code, italic, strike, underline } from '@bangle.dev/base-components';
import { spec as bulletListItemSpec } from '@packages/charmeditor/extensions/bulletList';
import * as hardBreak from '@packages/charmeditor/extensions/hardBreak';
import { spec as listItemSpec } from '@packages/charmeditor/extensions/listItem';
import { spec as orderedListItemSpec } from '@packages/charmeditor/extensions/orderedList';
import { spec as tabIndentSpec } from '@packages/charmeditor/extensions/tabIndent';
import type { PageContent } from '@packages/charmeditor/interfaces';

import * as codeBlock from './components/@bangle.dev/base-components/code-block';
import { SpecRegistry } from './components/@bangle.dev/core/specRegistry';
import { spec as bookmarkSpec } from './components/bookmark/bookmarkSpec';
import * as bulletList from './components/bulletList';
import * as button from './components/button/button.specs';
import * as callout from './components/callout/callout';
import * as columnLayout from './components/columnLayout/columnLayout.schema';
import { spec as cryptoPriceSpec } from './components/cryptoPrice/cryptoPriceSpec';
import * as disclosure from './components/disclosure';
import * as doc from './components/doc/doc';
import * as emoji from './components/emojiSuggest/emojiSuggest.specs';
import { spec as farcasterFrameSpec } from './components/farcasterFrame/farcasterFrameSpec';
import { deletion, formatChange, insertion } from './components/fiduswriter/schema/common/track';
import { specs as fileSpecs } from './components/file/file.specs';
import * as heading from './components/heading';
import * as horizontalRule from './components/horizontalRule';
import * as iframe from './components/iframe/iframeSpec';
import * as image from './components/image/imageSpecs';
import * as inlineComment from './components/inlineComment/inlineComment.specs';
import * as inlineDatabase from './components/inlineDatabase';
import { spec as inlinePaletteSpecs } from './components/inlinePalette/inlinePaletteSpec';
import * as inlineVote from './components/inlineVote/inlineVote.specs';
import { spec as linkSpec } from './components/link/link.specs';
import { linkedPageSpec } from './components/linkedPage/linkedPage.specs';
import * as listItem from './components/listItem/listItem';
import { mentionSpecs } from './components/mention/mention.specs';
import { nestedPageSpec } from './components/nestedPage/nestedPage.specs';
import * as nft from './components/nft/nft.specs';
import * as orderedList from './components/orderedList';
import { spec as paragraphSpec } from './components/paragraph/paragraph';
import { spec as pdfSpec } from './components/pdf/pdf';
import * as poll from './components/poll/pollSpec';
import * as quote from './components/quote/quote';
// import { spec as tableSpec } from './components/table/table.schema';
import { spec as tableSpec } from './components/table/table.specs';
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
  paragraphSpec(), // OK
  mentionSpecs(), // NO
  inlineVote.spec(),
  bold.spec(), // OK
  hardBreak.spec, // OK
  horizontalRule.spec(), // OK
  italic.spec(), // OK
  linkSpec(), // OK
  bulletList.spec(), // OK
  bulletListItemSpec, // Note that bullets should appear first, so drag/drop and copy/paste prefers bullet lists, since the type is not carried over
  listItem.spec(), // OK
  orderedList.spec(), // OK
  orderedListItemSpec(),
  listItemSpec,
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
  farcasterFrameSpec(),
  pdfSpec(), // NO
  image.spec(), // OK
  columnLayout.spec(), // NO
  nestedPageSpec(), // NO
  linkedPageSpec(),
  quote.spec(), // OK
  tabIndentSpec,
  // tableSpec(), // OK - only for text content
  tableSpec, // OK - only for text content
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
  button.spec(),
  poll.spec(),
  bookmarkSpec(),
  tableOfContentSpec(),
  fileSpecs()
]);
