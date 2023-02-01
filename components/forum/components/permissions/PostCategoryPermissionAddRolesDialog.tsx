import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import type { PostCategory, PostCategoryPermissionLevel } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { SmallSelect } from 'components/common/form/InputEnumToOptions';
import { InputSearchRole, InputSearchRoleMultiple } from 'components/common/form/InputSearchRole';
import Loader from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useRoles from 'hooks/useRoles';
import type {
  AssignedPostCategoryPermission,
  AvailablePostCategoryPermissionFlags
} from 'lib/permissions/forum/interfaces';
import { postCategoryPermissionLabels } from 'lib/permissions/forum/mapping';
import type { PostCategoryPermissionInput } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { conditionalPlural } from 'lib/utilities/strings';

import { PostCategoryRolePermissionRow } from './PostCategoryPermissionRow';
import type { BulkRolePostCategoryPermissionUpsert } from './shared';
import { forumMemberPermissionOptions } from './shared';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: BulkRolePostCategoryPermissionUpsert) => void;
  roleIdsToHide: string[];
};
export function PostCategoryPermissionAddRolesDialog({ isOpen, onClose, onSave, roleIdsToHide }: Props) {
  const [newRolesPermissionLevel, setNewRolesPermissionLevel] = useState<PostCategoryPermissionLevel>('member');
  const [newRoleIds, setNewRoleIds] = useState<string[]>([]);

  function addRolePermissions() {
    onSave({ roleIds: newRoleIds, permissionLevel: newRolesPermissionLevel });
    setNewRoleIds([]);
    setNewRolesPermissionLevel('member');
    onClose();
  }

  return (
    <Modal mobileDialog open={isOpen} onClose={onClose} title='Add members'>
      <Grid container direction='column' spacing={3}>
        <Grid container item xs justifyContent='space-between'>
          <Grid item xs={8}>
            <SmallSelect
              renderValue={(value) =>
                (forumMemberPermissionOptions[value as keyof typeof forumMemberPermissionOptions] as string as any) ||
                'No access'
              }
              onChange={(newValue) => setNewRolesPermissionLevel(newValue as PostCategoryPermissionLevel)}
              keyAndLabel={forumMemberPermissionOptions}
              defaultValue={newRolesPermissionLevel}
            />
          </Grid>
          <Grid item xs={4} justifyContent='flex-end'>
            <Button disableElevation fullWidth disabled={newRoleIds.length === 0} onClick={addRolePermissions}>
              Add roles
            </Button>
          </Grid>
        </Grid>
        <Grid item>
          <InputSearchRoleMultiple
            filter={{ mode: 'exclude', userIds: roleIdsToHide }}
            onChange={(ids: string[]) => setNewRoleIds(ids)}
            disableCloseOnSelect
          />
        </Grid>
        <Grid item></Grid>
      </Grid>
    </Modal>
  );
}
