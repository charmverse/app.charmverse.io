import type { EditorView } from '@bangle.dev/pm';

import type { PageMeta } from 'lib/pages';
import type { Contributor } from 'models/User';

export function extractTextFromSelection (view: EditorView, contributors: Contributor[], pages: Record<string, PageMeta | undefined>) {
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
        const contributor = contributors.find(_contributor => _contributor.id === value);
        if (contributor) {
          textContent += `@${(contributor.username)}`;
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
