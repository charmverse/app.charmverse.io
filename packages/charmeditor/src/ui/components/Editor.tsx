import type { SxProps } from '@mui/system';
import {
  useNodeViews,
  useEditorEventCallback,
  NodeViewComponentProps,
  react,
  ProseMirror
} from '@nytimes/react-prosemirror';
import { EditorState } from 'prosemirror-state';
import type { ElementType } from 'react';
import { useEffect, useState } from 'react';

import { plugins } from '../../plugins';
import { schema } from '../../schema';

import { OutlinedTextField } from './OutlinedTextField';

import '../prosemirror.css';
import '../../extensions/listItem/czi-vars.scss';
import '../../extensions/listItem/czi-indent.scss';
import '../../extensions/listItem/czi-list.scss';

export type EditorProps = {
  placeholder?: string;
  defaultValue?: object | null; // json value
  onChange?: (value: { json: object; text: string }) => void;
  component?: ElementType;
  sx?: SxProps;
  error?: boolean; // to style the component
};

const defaultState = EditorState.create({
  schema,
  plugins: plugins(schema)
});

export function Editor({
  component: Component = OutlinedTextField,
  error,
  onChange,
  placeholder,
  sx,
  defaultValue
}: EditorProps) {
  // const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [state, setEditorState] = useState(defaultState);
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
              onChange({
                json: newState.doc.toJSON(),
                text: newState.doc.textContent
              });
            });
          }
          return newState;
        });
      }}
    >
      {/** This div is where the contenteditable div is created by Prosemirror */}
      <Component className='ProseMirror' ref={setMount} sx={sx} error={error} />
      {/* {renderNodeViews()} */}
    </ProseMirror>
  );
}
