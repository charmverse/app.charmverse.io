
import { useMembers } from 'hooks/useMembers';

type Props = {
  updatedBy: string;
}

function LastModifiedBy (props: Props): JSX.Element {
  const { members } = useMembers();
  const member = members.find(user => user.id === props.updatedBy);
  return (
    <div className='LastModifiedBy octo-propertyvalue readonly'>
      {member?.username ?? props.updatedBy}
    </div>
  );
}

export default LastModifiedBy;
