import type { SxProps } from '@mui/system';
import {
  useNodeViews,
  useEditorEventCallback,
  NodeViewComponentProps,
  react,
  ProseMirror
} from '@nytimes/react-prosemirror';
import { EditorState } from 'prosemirror-state';
import { useState, useMemo } from 'react';
import type { ElementType, CSSProperties, useEffect } from 'react';

import indentStyles from '../../extensions/listItem/czi-indent.module.scss';
import listStyles from '../../extensions/listItem/czi-list.module.scss';
import varsStyles from '../../extensions/listItem/czi-vars.module.scss';
import { plugins } from '../../plugins';
import { schema } from '../../schema';
import editorStyles from '../editor.module.scss';
import pmStyles from '../prosemirror.module.scss';

import { OutlinedTextField } from './OutlinedTextField';

const moduleClassName = [
  editorStyles.ProseMirror,
  pmStyles.ProseMirror,
  listStyles.ProseMirror,
  indentStyles.ProseMirror,
  varsStyles.ProseMirror
].join(' ');

export type EditorProps = {
  placeholder?: string;
  defaultValue?: object | null; // json value
  onChange?: (value: { json: object; text: string }) => void;
  component?: ElementType;
  rows?: number;
  style?: CSSProperties;
  error?: boolean; // to style the component
};

export function Editor({
  component: Component = OutlinedTextField,
  error,
  onChange,
  placeholder,
  rows,
  style,
  defaultValue
}: EditorProps) {
  // const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [state, setEditorState] = useState(() =>
    EditorState.create({
      schema,
      doc: defaultValue ? schema.nodeFromJSON(defaultValue) : undefined,
      plugins: plugins(schema)
    })
  );
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
      {/** This div is where the contenteditable div is created by Prosemirror */}
      <Component className={`ProseMirror ${moduleClassName}`} ref={setMount} rows={rows} style={style} error={error} />
      {/* {renderNodeViews()} */}
    </ProseMirror>
  );
}
