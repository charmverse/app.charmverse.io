type Props = {
  amount?: number;
};

export function TokenAmount(props: Props): JSX.Element {
  return <div className='octo-propertyvalue readonly'>{props.amount}</div>;
}
