import { usePostCategoryPermissions } from 'components/forum/hooks/usePostCategoryPermissions';
import { usePostCategoryPermissionsList } from 'components/forum/hooks/usePostCategoryPermissionsList';

import { SharePostCategoryToWeb } from '../components/SharePostCategoryToWeb';

type Props = {
  postCategoryId: string;
};

export function PaidSharePostCategoryToWeb({ postCategoryId }: Props) {
  const { permissionsList, addPermission, deletePermission } = usePostCategoryPermissionsList({
    postCategoryId
  });

  const publicPermission = permissionsList?.find((p) => p.assignee.group === 'public');

  const { permissions: currentUserPermissions } = usePostCategoryPermissions(postCategoryId);

  function togglePublic() {
    if (publicPermission) {
      deletePermission(publicPermission.id);
    } else {
      addPermission({
        permissionLevel: 'view',
        postCategoryId,
        assignee: { group: 'public' }
      });
    }
  }
  return (
    <SharePostCategoryToWeb
      onChange={togglePublic}
      disabled={!currentUserPermissions?.manage_permissions}
      isChecked={!!publicPermission}
      disabledTooltip='You cannot manage permissions for this post category'
    />
  );
}
