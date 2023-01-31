import { BangleEditorState } from '@bangle.dev/core';
import { markdownSerializer } from '@bangle.dev/markdown';
import { Node } from '@bangle.dev/pm';
import type { Prisma } from '@prisma/client';

import { replaceNestedPages } from 'components/common/CharmEditor/components/nestedPage';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import type { Member } from 'lib/members/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

export type CharmMarkdownGeneratorOptions = {
  members?: Member[];
};

export async function generateMarkdown(
  page: {
    title: string;
    content: Prisma.JsonValue;
  },
  withTitle: boolean = false,
  generatorOptions: CharmMarkdownGeneratorOptions = {}
): Promise<string> {
  if (page) {
    const serializer = markdownSerializer(specRegistry);

    const state = new BangleEditorState({
      specRegistry,
      initialValue: page.content ? Node.fromJSON(specRegistry.schema, page.content as PageContent) : '',
      editorProps: {
        attributes: {
          example: 'value'
        }
      }
    });

    (serializer.options as any).charmOptions = generatorOptions;

    let markdown = serializer.serialize(state.pmState.doc);

    // Logic added here as the markdown serializer is synchronous
    markdown = await replaceNestedPages(markdown);

    if (page.title && withTitle) {
      const pageTitleAsMarkdown = `# ${page.title}`;

      markdown = `${pageTitleAsMarkdown}\r\n\r\n${markdown}`;
    }

    return markdown;
  }
  return '';
}
