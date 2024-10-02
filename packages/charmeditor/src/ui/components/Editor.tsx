import { ProseMirror, react } from '@nytimes/react-prosemirror';
import { EditorState } from 'prosemirror-state';
import { useState } from 'react';
import type { ElementType, CSSProperties } from 'react';

import { groups as pluginGroups } from '../../plugins';
import type { ExtensionGroup } from '../../schema';
import { groups as schemaGroups } from '../../schema';
import { className } from '../styles';

import { OutlinedTextField } from './OutlinedTextField';
import { Readonly } from './Readonly';

export type EditorProps = {
  extensionGroup: ExtensionGroup;
  component?: ElementType;
  placeholder?: string;
  autoFocus?: boolean;
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
  autoFocus,
  placeholder,
  readOnly,
  rows,
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
          autoFocus={autoFocus}
          className={`ProseMirror ${className}`}
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
