
interface Props {
  readOnly: boolean;
}

export default function DatabaseView ({ readOnly }: Props) {
  return (
    <div>
      <h1>Inline Database goes here :D</h1>
    </div>
  );
}
