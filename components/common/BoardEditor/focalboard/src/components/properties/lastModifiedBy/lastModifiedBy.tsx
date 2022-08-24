
import { useContributors } from 'hooks/useContributors';

type Props = {
  updatedBy: string
}

function LastModifiedBy (props: Props): JSX.Element {
  const [contributors] = useContributors();
  const contributor = contributors.find(user => user.id === props.updatedBy);
  return (
    <div className='LastModifiedBy octo-propertyvalue readonly'>
      {contributor?.username ?? props.updatedBy}
    </div>
  );
}

export default LastModifiedBy;
