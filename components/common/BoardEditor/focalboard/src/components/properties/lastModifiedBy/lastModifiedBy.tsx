import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';

type Props = {
  updatedBy: string;
};

function LastModifiedBy(props: Props) {
  const { getMemberById } = useMembers();
  const member = getMemberById(props.updatedBy);

  return member ? (
    <div style={{ width: 'fit-content' }} className='LastModifiedBy readonly octo-propertyvalue'>
      <UserDisplay user={member} avatarSize='xSmall' fontSize='small' />
    </div>
  ) : null;
}

export default LastModifiedBy;
