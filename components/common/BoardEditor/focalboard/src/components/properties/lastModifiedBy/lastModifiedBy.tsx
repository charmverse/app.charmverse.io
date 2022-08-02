
import { IUser } from '../../../user';
import { getWorkspaceUsers } from '../../../store/users';
import { useAppSelector } from '../../../store/hooks';

type Props = {
    updatedBy: string
}

function LastModifiedBy (props: Props): JSX.Element {
  const workspaceUsersById = useAppSelector<{[key:string]: IUser}>(getWorkspaceUsers);
  return (
    <div className='LastModifiedBy octo-propertyvalue readonly'>
      {(workspaceUsersById && workspaceUsersById[props.updatedBy]?.username) || props.updatedBy}
    </div>
  );
}

export default LastModifiedBy;
