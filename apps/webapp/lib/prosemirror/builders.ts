import type { Node } from 'prosemirror-model';
import { builders as makeBuilders } from 'prosemirror-test-builder';

import { specRegistry } from 'components/common/CharmEditor/specRegistry';

export type Builder = (...args: (string | Node | object)[]) => Node;

// TODO: find an automated way to get these types
export type NodeType =
  | 'blockquote'
  | 'bold'
  | 'bookmark'
  | 'bullet_list'
  | 'bulletList'
  | 'checkbox'
  | 'code'
  | 'codeBlock'
  | 'columnLayout'
  | 'columnBlock'
  | 'cryptoPrice'
  | 'farcasterFrame'
  | 'date'
  | 'deletion'
  | 'disclosure'
  | 'disclosureDetails'
  | 'disclosureSummary'
  | 'doc'
  | 'emoji'
  | 'emojiSuggest'
  | 'file'
  | 'format_change'
  | 'hardBreak'
  | 'heading'
  | 'horizontalRule'
  | 'iframe'
  | 'image'
  | 'img'
  | 'in'
  | 'inline-comment'
  | 'inline-vote'
  | 'inline-command-palette-pale'
  | 'inline-command-palette-paletteMark'
  | 'inlineDatabase'
  | 'insertion'
  | 'italic'
  | 'label'
  | 'link'
  | 'linkedPage'
  | 'list_item'
  | 'listItem'
  | 'mention'
  | 'mentionSuggest'
  | 'nestedPageSuggest'
  | 'nft'
  | 'ordered_list'
  | 'orderedList'
  | 'p'
  | 'page'
  | 'paragraph'
  | 'pdf'
  | 'poll'
  | 'quote'
  | 'strike'
  | 'tabIndent'
  | 'table'
  | 'table_row'
  | 'table_cell'
  | 'table_header'
  | 'tableOfContents'
  | 'text-color'
  | 'tooltip'
  | 'tooltip-marker'
  | 'tweet'
  | 'video'
  | 'underline';

const defaultBuilders = makeBuilders(specRegistry.schema) as any as Record<NodeType, Builder> & {
  schema: { nodes: Record<NodeType, any> };
};

// add shortcuts
const shortcuts = {
  p: defaultBuilders.paragraph,
  img: defaultBuilders.image
};
Object.assign(defaultBuilders, shortcuts);

export const builders = {
  ...defaultBuilders,
  schema: defaultBuilders.schema,
  ...shortcuts
};

// add an alias to make declarations more concise
export const _ = builders;

export function jsonDoc(...args: (string | Node | object)[]) {
  return builders.doc(...args).toJSON();
}
