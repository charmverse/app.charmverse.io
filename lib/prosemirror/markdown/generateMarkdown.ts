import { Node } from '@bangle.dev/pm';

import { replaceNestedPages } from 'components/common/CharmEditor/components/nestedPage/nestedPage.utils';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import type { Member } from 'lib/members/interfaces';

import { markdownSerializer } from './markdownSerializer';

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

  (serializer.options as any).charmOptions = generatorOptions;

  let markdown = content ? serializer.serialize(Node.fromJSON(specRegistry.schema, content)) : '';

  // Logic added here as the markdown serializer is synchronous
  markdown = await replaceNestedPages(markdown);

  if (title) {
    const pageTitleAsMarkdown = `# ${title}`;

    markdown = `${pageTitleAsMarkdown}\r\n\r\n${markdown}`;
  }

  return markdown;
}
