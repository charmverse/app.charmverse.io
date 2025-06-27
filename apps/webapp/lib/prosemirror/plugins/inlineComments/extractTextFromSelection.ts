import type { PageMeta } from '@packages/core/pages';
import type { Member } from '@packages/lib/members/interfaces';
import type { EditorView } from 'prosemirror-view';

export function extractTextFromSelection(
  view: EditorView,
  getMemberById: (id: string) => Member | undefined,
  pages: Record<string, PageMeta | undefined>
) {
  // Get the context from current selection
  const cutDoc = view.state.doc.cut(view.state.selection.from, view.state.selection.to);
  let textContent = '';
  cutDoc.descendants((node) => {
    if (node.isText) {
      textContent += node.text;
    } else if (node.type.name === 'mention') {
      const { type, value } = node.attrs;
      if (type === 'user') {
        const member = getMemberById(value);
        if (member) {
          textContent += `@${member.username}`;
        }
      } else {
        const page = pages[value];
        if (page) {
          textContent += `@${page.title || 'Untitled'}`;
        }
      }
    } else if (node.type.name === 'emoji') {
      textContent += node.attrs.emoji;
    }
  });
  return textContent;
}
