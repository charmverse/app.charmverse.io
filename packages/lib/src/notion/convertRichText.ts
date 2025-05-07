import type { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import type { TextContent, MentionNode } from 'lib/prosemirror/interfaces';

export function convertRichText(richTexts: RichTextItemResponse[]) {
  const contents: (TextContent | MentionNode)[] = [];

  richTexts.forEach((richText) => {
    const marks: { type: string; attrs?: Record<string, string> }[] = [];
    if (richText.type !== 'mention') {
      if (richText.annotations.strikethrough) {
        marks.push({ type: 'strike' });
      }

      if (richText.annotations.color) {
        if (richText.annotations.color.endsWith('background')) {
          marks.push({ type: 'text-color', attrs: { color: '', bgColor: richText.annotations.color } });
        } else {
          marks.push({ type: 'text-color', attrs: { color: richText.annotations.color, bgColor: '' } });
        }
      }

      if (richText.annotations.strikethrough) {
        marks.push({ type: 'strike' });
      }

      if (richText.annotations.bold) {
        marks.push({ type: 'bold' });
      }

      if (richText.annotations.italic) {
        marks.push({ type: 'italic' });
      }

      if (richText.annotations.underline) {
        marks.push({ type: 'underline' });
      }

      if (richText.annotations.code) {
        marks.push({ type: 'code' });
      }

      if (richText.href) {
        marks.push({
          type: 'link',
          attrs: {
            href: richText.href
          }
        });
      }

      if (richText.plain_text) {
        contents.push({
          type: 'text',
          text: richText.plain_text,
          marks
        });
      }
    } else if (richText.mention?.type === 'page') {
      const inlineLinkedPage: MentionNode = {
        type: 'mention',
        attrs: {
          type: 'page',
          value: richText.mention.page.id
        }
      };
      contents.push(inlineLinkedPage);
    } else if (richText.mention?.type === 'database') {
      const inlineLinkedPage: MentionNode = {
        type: 'mention',
        attrs: {
          type: 'page',
          value: richText.mention.database.id
        }
      };
      contents.push(inlineLinkedPage);
    }
  });

  return contents;
}
