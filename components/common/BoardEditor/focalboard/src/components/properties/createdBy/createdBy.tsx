import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';

type Props = {
  userId: string;
};

function CreatedBy(props: Props) {
  const { getMemberById } = useMembers();
  const member = getMemberById(props.userId);

  return member ? (
    <div style={{ width: 'fit-content' }} className='UserProperty readonly octo-propertyvalue'>
      <UserDisplay user={member} avatarSize='xSmall' fontSize='small' />
    </div>
  ) : null;
}

export default CreatedBy;
