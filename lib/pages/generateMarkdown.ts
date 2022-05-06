import { BangleEditorState } from '@bangle.dev/core';
import { markdownSerializer } from '@bangle.dev/markdown';
import { Node } from '@bangle.dev/pm';
import { Page } from '@prisma/client';
import { specRegistry } from 'components/common/CharmEditor/CharmEditor';
import { PageContent } from 'models';

export function generateMarkdown (page: Page, withTitle: boolean = false): string {

  const isExportablePage = page && (page.type === 'page' || page.type === 'card');

  if (page && isExportablePage) {
    const serializer = markdownSerializer(specRegistry);

    const state = new BangleEditorState({
      specRegistry,
      initialValue: page.content ? Node.fromJSON(specRegistry.schema, page.content as PageContent) : ''
    });

    let markdown = serializer.serialize(state.pmState.doc);

    if (page.title && withTitle) {
      const pageTitleAsMarkdown = `# ${page.title}`;

      markdown = `${pageTitleAsMarkdown}\r\n\r\n${markdown}`;
    }

    return markdown;
  }
  return '';

}
