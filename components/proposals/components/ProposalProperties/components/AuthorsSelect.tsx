import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';

type Props = {
  readOnly: boolean;
  value: string[];
  onChange: (value: string[]) => void;
};

export function AuthorsSelect({ readOnly, onChange, value }: Props) {
  return (
    <UserSelect memberIds={value} readOnly={readOnly} onChange={onChange} wrapColumn showEmptyPlaceholder={true} />
  );
}
