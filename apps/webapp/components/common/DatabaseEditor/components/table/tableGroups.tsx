import { useCallback } from 'react';

import { useLocalStorage } from 'hooks/useLocalStorage';
import type { BoardGroup } from '@packages/databases/board';

import { PaginatedRows } from './PaginatedRows';
import type { Props as TableGroupProps } from './tableGroup';
import TableGroup from './tableGroup';

type Props = Omit<TableGroupProps, 'group' | 'isExpandedGroup' | 'toggleGroup'> & { groups: BoardGroup[] };

export function TableGroups({ groups, ...props }: Props) {
  const [collapsedGroups, setCollapsedGroups] = useLocalStorage<Record<string, string[]>>(`collapsed-groups`, {});

  const viewId = props.activeView.id;

  const toggleGroup = useCallback(
    function toggleGroup(id: string) {
      setCollapsedGroups((prev) => {
        const newCollapsedGroupIds = { ...prev };
        newCollapsedGroupIds[viewId] = newCollapsedGroupIds[viewId] || [];
        if (newCollapsedGroupIds[viewId].includes(id)) {
          newCollapsedGroupIds[viewId] = newCollapsedGroupIds[viewId].filter((groupId) => groupId !== id);
        } else {
          newCollapsedGroupIds[viewId].push(id);
        }
        return newCollapsedGroupIds;
      });
    },
    [setCollapsedGroups, viewId]
  );

  const collapsedGroupIds = collapsedGroups?.[viewId];
  // return undefined until we have loaded the collapsed groups from Local storage
  const isExpanded = (groupId: string) => (collapsedGroups ? !collapsedGroupIds?.includes(groupId) : undefined);

  return (
    <PaginatedRows rows={groups}>
      {(group) => (
        <TableGroup
          key={group.id}
          group={group}
          isExpandedGroup={isExpanded(group.id)}
          toggleGroup={toggleGroup}
          {...props}
        />
      )}
    </PaginatedRows>
  );
}
