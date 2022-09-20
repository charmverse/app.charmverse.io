import type { AssignablePermissionGroupsWithPublic } from './interfaces';

const assignableGroups: Exclude<AssignablePermissionGroupsWithPublic, 'any'>[] = ['user', 'role', 'space', 'public'];

export function assigneeGroupIsValid (input: any): boolean {

  return assignableGroups.indexOf(input) >= 0;

}
