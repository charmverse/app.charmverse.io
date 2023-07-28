import { BangleEditorState } from '@bangle.dev/core';
import { markdownSerializer } from '@bangle.dev/markdown';
import { Node } from '@bangle.dev/pm';

import { replaceNestedPages } from 'components/common/CharmEditor/components/nestedPage';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import type { Member } from 'lib/members/interfaces';

export type CharmMarkdownGeneratorOptions = {
  members?: Member[];
};

export async function generateMarkdown({
  title,
  content,
  generatorOptions = {}
}: {
  title?: string;
  content: any;
  generatorOptions?: CharmMarkdownGeneratorOptions;
}): Promise<string> {
  const serializer = markdownSerializer(specRegistry);

  const state = new BangleEditorState({
    specRegistry,
    initialValue: content ? Node.fromJSON(specRegistry.schema, content) : '',
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

  if (title) {
    const pageTitleAsMarkdown = `# ${title}`;

    markdown = `${pageTitleAsMarkdown}\r\n\r\n${markdown}`;
  }

  return markdown;
}
