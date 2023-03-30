import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';

type Props = {
  updatedBy: string;
};

function LastModifiedBy(props: Props) {
  const { members } = useMembers();
  const member = members.find((user) => user.id === props.updatedBy);

  return member ? (
    <div style={{ width: 'fit-content' }} className='LastModifiedBy readonly octo-propertyvalue'>
      <UserDisplay user={member} avatarSize='xSmall' fontSize='small' />
    </div>
  ) : null;
}

export default LastModifiedBy;
