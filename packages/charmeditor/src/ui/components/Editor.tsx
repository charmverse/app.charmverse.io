import { ProseMirror, react } from '@nytimes/react-prosemirror';
import type { Schema } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';
import { EditorState } from 'prosemirror-state';
import { useState } from 'react';
import type { ElementType, CSSProperties } from 'react';

import type { RawPlugins } from '../../buildPlugins';
import indentStyles from '../../extensions/listItem/czi-indent.module.scss';
import listStyles from '../../extensions/listItem/czi-list.module.scss';
import varsStyles from '../../extensions/listItem/czi-vars.module.scss';
// import { plugins } from '../../plugins';
// import { schema } from '../../schema';
import { groups as pluginGroups } from '../../plugins';
import type { ExtensionGroup } from '../../schema';
import { groups as schemaGroups } from '../../schema';
import editorStyles from '../editor.module.scss';
import pmStyles from '../prosemirror.module.scss';

import { OutlinedTextField } from './OutlinedTextField';
import { Readonly } from './Readonly';

const moduleClassName = [
  editorStyles.ProseMirror,
  pmStyles.ProseMirror,
  listStyles.ProseMirror,
  indentStyles.ProseMirror,
  varsStyles.ProseMirror
].join(' ');

export type EditorProps = {
  extensionGroup: ExtensionGroup;
  component?: ElementType;
  // plugins: (schema: Schema) => Plugin[];
  // schema: Schema;
  placeholder?: string;
  defaultValue?: object | null; // json value
  onChange?: (value: { json: object; text: string }) => void;
  readOnly?: boolean;
  rows?: number;
  style?: CSSProperties;
  error?: boolean; // to style the component
};

export function Editor({
  component: Component = OutlinedTextField,
  extensionGroup,
  error,
  onChange,
  placeholder,
  readOnly,
  rows,
  // plugins = () => [],
  // schema,
  style,
  defaultValue
}: EditorProps) {
  // const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [state, setEditorState] = useState(() => {
    const schema = schemaGroups[extensionGroup];
    const plugins = pluginGroups[extensionGroup](schema);
    if (!schema || !plugins) {
      throw new Error(`Invalid extension group: ${extensionGroup}`);
    }
    return EditorState.create({
      schema,
      doc: defaultValue ? schema.nodeFromJSON(defaultValue) : undefined,
      plugins: [
        // You must add the react plugin if you use
        // the useNodeViews or useNodePos hook.
        react(),
        ...plugins
      ]
    });
  });
  const [mount, setMount] = useState<HTMLElement | null>(null);

  return (
    <ProseMirror
      mount={mount}
      defaultState={state}
      dispatchTransaction={(tr) => {
        setEditorState((s) => {
          const newState = s.apply(tr);
          if (onChange) {
            // setTimeout so we finish setting editor state before calling onChange
            setTimeout(() => {
              const value = {
                // create a getter so the handler has the option to delay the cost of casting to JSON
                get json() {
                  return newState.doc.toJSON();
                },
                text: newState.doc.textContent
              };
              onChange(value);
            });
          }
          return newState;
        });
      }}
    >
      <Readonly readOnly={readOnly}>
        {/** This div is where the contenteditable div is created by Prosemirror */}
        <Component
          className={`ProseMirror ${moduleClassName}`}
          translate={readOnly ? 'yes' : 'no'}
          ref={setMount}
          rows={rows}
          style={style}
          error={error}
        />
        {/* {renderNodeViews()} */}
      </Readonly>
    </ProseMirror>
  );
}
