// Reference: https://github.com/bangle-io/bangle-editor/blob/13127cf2e4187ebaa6d5e01d80f4e9018fae02a5/lib/core/src/bangle-editor-state.ts

import type { dropCursor as pmDropCursor, EditorProps, Mark, ParseOptions, Schema, Selection } from '@bangle.dev/pm';
import { DOMParser, EditorState, Node } from '@bangle.dev/pm';
import { log } from '@charmverse/core/log';

import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';
import { SpecRegistry } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';
import type { RawSpecs } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

import { pluginLoader } from './plugin-loader';

type InitialContent = string | Node | object;

export interface BangleEditorStateProps<PluginMetadata = any> {
  specRegistry?: SpecRegistry;
  specs?: RawSpecs;
  plugins?: RawPlugins;
  initialValue?: InitialContent;
  editorProps?: EditorProps;
  pmStateOpts?: {
    selection?: Selection | undefined;
    storedMarks?: Mark[] | null | undefined;
  };
  pluginMetadata?: PluginMetadata;
  dropCursorOpts?: Parameters<typeof pmDropCursor>[0];
}

const createDocument = ({
  schema,
  content,
  parseOptions
}: {
  schema: Schema;
  content?: InitialContent;
  parseOptions?: ParseOptions;
}): Node | undefined => {
  const emptyDocument = {
    type: 'doc',
    content: [
      {
        type: 'paragraph'
      }
    ]
  };

  if (content == null) {
    return schema.nodeFromJSON(emptyDocument);
  }

  if (content instanceof Node) {
    return content;
  }
  if (typeof content === 'object') {
    return schema.nodeFromJSON(content);
  }

  if (typeof content === 'string') {
    const element = document.createElement('div');
    element.innerHTML = content.trim();
    return DOMParser.fromSchema(schema).parse(element, parseOptions);
  }

  return undefined;
};

export class BangleEditorState<PluginMetadata> {
  specRegistry: SpecRegistry;

  pmState: EditorState;

  constructor({
    specRegistry,
    specs,
    plugins = () => [],
    initialValue,
    editorProps,
    pmStateOpts,
    pluginMetadata,
    dropCursorOpts
  }: BangleEditorStateProps<PluginMetadata> = {}) {
    if (specs && specRegistry) {
      throw new Error('Cannot have both specs and specRegistry defined');
    }

    if (!specRegistry) {
      specRegistry = new SpecRegistry(specs);
    }

    if (Array.isArray(plugins)) {
      log.warn(
        'The use plugins as an array is deprecated, please pass a function which returns an array of plugins. Refer: https://bangle.dev/docs/api/core#bangleeditorstate'
      );
    }
    this.specRegistry = specRegistry;
    const schema = this.specRegistry.schema;

    const pmPlugins = pluginLoader(specRegistry, plugins, {
      editorProps,
      metadata: pluginMetadata,
      dropCursorOpts
    });

    this.pmState = EditorState.create({
      schema,
      doc: createDocument({ schema, content: initialValue }),
      plugins: pmPlugins,
      ...pmStateOpts
    });
  }
}
