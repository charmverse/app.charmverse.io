import type { MemberProperty } from '@charmverse/core/dist/cjs/prisma-client';
import { v4 } from 'uuid';

export function createMemberProperty(
  memberProperty: Pick<MemberProperty, 'name' | 'index' | 'type' | 'spaceId' | 'createdBy' | 'updatedBy'>
): MemberProperty {
  return {
    createdAt: new Date(),
    id: v4(),
    updatedAt: new Date(),
    enabledViews: ['gallery', 'table', 'profile'],
    options: null,
    ...memberProperty
  };
}
