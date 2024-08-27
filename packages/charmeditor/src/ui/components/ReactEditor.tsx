export type ReactEditorProps = {
  value?: object | null;
};

export function ReactEditor({ value }: ReactEditorProps) {
  return <div>ReactEditor: {value?.toString()}</div>;
}
