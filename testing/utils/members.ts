import type { MemberProperty, MemberPropertyType } from '@prisma/client';

import { createMemberProperty } from 'lib/members/createMemberProperty';

type GenerateMemberPropertyProps = {
  type?: MemberPropertyType;
  name: string;
  spaceId: string;
  userId: string;
  options?: any;
}

export function generateMemberProperty ({ type = 'text', spaceId, userId, options, name }: GenerateMemberPropertyProps): Promise<MemberProperty> {
  return createMemberProperty({
    data: {
      name,
      type,
      space: { connect: { id: spaceId } },
      createdBy: '',
      updatedBy: '',
      options
    },
    userId
  });
}
