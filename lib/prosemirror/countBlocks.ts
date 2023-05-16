import { log } from '@charmverse/core/log';

import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';

// dont count these nodes as "BLOCKS" because they are really inline marks
const INLINE_NODES_TO_IGNORE = [
  'bold',
  'code',
  'columnBlock',
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
  'strike',
  'tabIndent',
  'table_cell',
  'table_header',
  'text',
  'text-color',
  'tooltip-marker',
  'underline'
];

export function countBlocks(pageContent: any | null, spaceId?: string) {
  let count = 0;
  if (pageContent) {
    try {
      const doc = getNodeFromJson(pageContent);
      if (doc) {
        doc.nodesBetween(0, doc.nodeSize, (node) => {
          if (node.type && !INLINE_NODES_TO_IGNORE.includes(node.type.name)) {
            count += 1;
          }
        });
      }
    } catch (error) {
      log.error('Error counting prosemirror blocks', { error, pageContent, spaceId });
    }
  }
  return count;
}
