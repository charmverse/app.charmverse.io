import type { SxProps } from '@mui/system';
import {
  useNodeViews,
  useEditorEventCallback,
  NodeViewComponentProps,
  react,
  ProseMirror
} from '@nytimes/react-prosemirror';
import { schema } from 'prosemirror-schema-basic';
import { EditorState } from 'prosemirror-state';
import type { ElementType } from 'react';
import { useState } from 'react';

import { OutlinedTextField } from './OutlinedTextField';

export type EditorProps = {
  placeholder?: string;
  value?: object | null;
  onChange: (value: { json: object; text: string }) => void;
  component?: ElementType;
  sx?: SxProps;
};

const state = EditorState.create({
  schema
  // You must add the react plugin if you use
  // the useNodeViews or useNodePos hook.
  // plugins: [react()]
});

export function Editor({ placeholder, value, onChange, component: Component = OutlinedTextField, sx }: EditorProps) {
  // const { nodeViews, renderNodeViews } = useNodeViews(reactNodeViews);
  const [mount, setMount] = useState<HTMLElement | null>(null);

  return (
    <ProseMirror mount={mount} defaultState={state}>
      {/** This div is where the contenteditable div is created by Prosemirror */}
      <Component ref={setMount} sx={sx} />
      {/* {renderNodeViews()} */}
    </ProseMirror>
  );
}
