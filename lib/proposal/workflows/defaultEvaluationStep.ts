import { v4 as uuid } from 'uuid';

import { SystemRole } from './interfaces';
import type { PermissionGroup, PermissionLevel, EvaluationTemplate } from './interfaces';

export function getDefaultEvaluationStep(evaluation?: Partial<EvaluationTemplate>): EvaluationTemplate {
  return {
    id: uuid(),
    title: '',
    type: 'pass_fail',
    permissions: [
      // author permissions
      ...['view', 'edit', 'comment', 'move'].map((level) => ({
        id: SystemRole.author,
        level: level as PermissionLevel,
        group: 'system_role' as PermissionGroup
      })),
      // reviewer permissions
      ...['view', 'comment', 'move'].map((level) => ({
        id: SystemRole.current_reviewer,
        level: level as PermissionLevel,
        group: 'system_role' as PermissionGroup
      })),
      ...['view', 'comment'].map((level) => ({
        id: SystemRole.all_reviewers,
        level: level as PermissionLevel,
        group: 'system_role' as PermissionGroup
      })),
      // member permissions
      ...['view', 'comment'].map((level) => ({
        id: SystemRole.space_member,
        level: level as PermissionLevel,
        group: 'system_role' as PermissionGroup
      }))
    ],
    ...evaluation
  };
}
