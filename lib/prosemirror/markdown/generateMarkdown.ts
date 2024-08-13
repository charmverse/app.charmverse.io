import type { User } from '@charmverse/core/prisma';
import { prettyPrint } from '@root/lib/utils/strings';
import { Node } from 'prosemirror-model';

import { mentionSuggestMarkName } from 'components/common/CharmEditor/components/mention';
import { mentionSuggestSpec } from 'components/common/CharmEditor/components/mention/mention.specs';
import { replaceNestedPages } from 'components/common/CharmEditor/components/nestedPage/nestedPage.utils';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';

import { markdownSerializer } from './markdownSerializer';

export type CharmMarkdownGeneratorOptions = {
  members?: Pick<User, 'id' | 'username'>[];
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
  prettyPrint({ title, content, generatorOptions });

  const serializer = markdownSerializer(specRegistry);

  (serializer.options as any).charmOptions = generatorOptions;

  serializer.marks[mentionSuggestMarkName] = mentionSuggestSpec().markdown?.toMarkdown as any;

  // TODO - Clean up the nodes here

  let markdown = content ? serializer.serialize(Node.fromJSON(specRegistry.schema, content)) : '';

  // Logic added here as the markdown serializer is synchronous
  markdown = await replaceNestedPages(markdown);

  if (title) {
    const pageTitleAsMarkdown = `# ${title}`;

    markdown = `${pageTitleAsMarkdown}\r\n\r\n${markdown}`;
  }

  return markdown;
}
