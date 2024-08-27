export type ReactEditorProps = {
  placeholder?: string;
  value?: object | null;
  onChange: (value: { json: object; text: string }) => void;
};

export function ReactEditor({ placeholder, value, onChange }: ReactEditorProps) {
  return <div>ReactEditor: {value?.toString()}</div>;
}
