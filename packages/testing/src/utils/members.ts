import type { MemberProperty, MemberPropertyType, MemberPropertyValue, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { createMemberProperty } from '@root/lib/members/createMemberProperty';
import type { MemberPropertyValueType } from '@root/lib/members/interfaces';

type GenerateMemberPropertyProps = {
  type?: MemberPropertyType;
  name: string;
  spaceId: string;
  userId: string;
  options?: any;
  index?: number;
};

type GenerateMemberPropertyValueProps = {
  memberPropertyId: string;
  spaceId: string;
  userId: string;
  value?: MemberPropertyValueType;
};

export function generateMemberProperty({
  type = 'text',
  spaceId,
  userId,
  options,
  name,
  index
}: GenerateMemberPropertyProps): Promise<MemberProperty> {
  return createMemberProperty({
    data: {
      name,
      type,
      space: { connect: { id: spaceId } },
      createdBy: '',
      updatedBy: '',
      options,
      index
    },
    spaceId,
    userId
  });
}

export function generateMemberPropertyValue({
  memberPropertyId,
  spaceId,
  userId,
  value
}: GenerateMemberPropertyValueProps): Promise<MemberPropertyValue> {
  return prisma.memberPropertyValue.create({
    data: {
      spaceId,
      userId,
      memberPropertyId,
      value: value as Prisma.InputJsonValue,
      updatedBy: userId
    }
  });
}
