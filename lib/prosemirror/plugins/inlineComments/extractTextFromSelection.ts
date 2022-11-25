import type { EditorView } from '@bangle.dev/pm';

import type { Member } from 'lib/members/interfaces';
import type { PageMeta } from 'lib/pages';

export function extractTextFromSelection (view: EditorView, members: Member[], pages: Record<string, PageMeta | undefined>) {
  // Get the context from current selection
  const cutDoc = view.state.doc.cut(view.state.selection.from, view.state.selection.to);
  let textContent = '';
  cutDoc.descendants(node => {
    if (node.isText) {
      textContent += node.text;
    }
    else if (node.type.name === 'mention') {
      const { type, value } = node.attrs;
      if (type === 'user') {
        const member = members.find(_member => _member.id === value);
        if (member) {
          textContent += `@${(member.username)}`;
        }
      }
      else {
        const page = pages[value];
        if (page) {
          textContent += `@${page.title || 'Untitled'}`;
        }
      }
    }
    else if (node.type.name === 'emoji') {
      textContent += node.attrs.emoji;
    }
  });
  return textContent;
}
