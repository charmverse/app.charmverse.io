import { Node } from '@bangle.dev/pm';
import { BangleEditorState } from '@bangle.dev/core';
import { markdownSerializer } from '@bangle.dev/markdown';

import { charmEditorPlugins, specRegistry } from '../components/common/CharmEditor/CharmEditor';
import { gettingStartedPageContent } from '../seedData';

function generateMarkdown (content: any): string {

  const serializer = markdownSerializer(specRegistry);

  const state = new BangleEditorState({
    specRegistry,
    plugins: charmEditorPlugins(),
    initialValue: Node.fromJSON(specRegistry.schema, content)
  });

  return serializer.serialize(state.pmState.doc);
}

(async () => {

  const markdown = generateMarkdown(gettingStartedPageContent());
  console.log('markdown:\n', markdown);
  process.exit();
})();
