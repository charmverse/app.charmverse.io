import { log } from '@packages/core/log';

import { getNodeFromJson } from './getNodeFromJson';

// dont count these nodes as "BLOCKS" because they are really inline marks
const INLINE_NODES_TO_IGNORE = [
  'bold',
  'bullet_list',
  'bulletList',
  'code',
  'columnBlock',
  'date',
  'deletion',
  'disclosureSummary',
  'doc',
  'emoji',
  'emojiSuggest',
  'format_change',
  'hardBreak',
  'inline-command-palette-paletteMark',
  'inline-comment',
  'insertion',
  'italic',
  'label',
  'link',
  'mention',
  'mentionSuggest',
  'nestedPageSuggest',
  'ordered_list',
  'orderedList',
  'strike',
  'tabIndent',
  'table_cell',
  'table_header',
  'text',
  'text-color',
  'tooltip-marker',
  'underline'
];

export function countBlocks(
  pageContent: any | null,
  meta: { spaceId?: string; blockId?: string; postId?: string; pageId?: string } = {}
) {
  let count = 0;
  if (pageContent) {
    try {
      const doc = getNodeFromJson(pageContent);
      if (doc) {
        doc.nodesBetween(0, doc.content.size, (node) => {
          if (node.type && !INLINE_NODES_TO_IGNORE.includes(node.type.name)) {
            count += 1;
          }
        });
      }
    } catch (error) {
      // assume that spaceId is passed if we care about logging
      log.error('Error counting prosemirror blocks', {
        error,
        pageContent,
        ...meta
      });
    }
  }
  return count;
}
