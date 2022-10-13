import { createMemberProperty } from "lib/members/createMemberProperty";
import { prisma} from 'db'
import { Prisma } from "@prisma/client";

export async function seedMemberProp() {
  const zz = await createMemberProperty({ name: 'test2', type: 'text',
   space: { connect: { id: '8cee49eb-68bb-444c-8dbf-bdfa776b172a'}},
   createdBy: 'e8f5e4e9-4099-4b7d-aab8-42747cd1fe1b', updatedBy: 'e8f5e4e9-4099-4b7d-aab8-42747cd1fe1b',
   updatedAt: new Date()
  })

  console.log('🔥', zz);
}

export async function seedMemberPropValue() {

  const zz = await prisma.memberPropertyValue.create({ 
    data: { 
      memberProperty: { connect: { id: 'cfd1e4bc-403e-49bb-91b4-9d923cc09464'}}, 
      user: { connect: { id: 'e8f5e4e9-4099-4b7d-aab8-42747cd1fe1b'}}, 
      space: { connect: { id: '8cee49eb-68bb-444c-8dbf-bdfa776b172a'}},
      updatedBy: '755da978-f034-47db-bb3c-378f7c690fd2',
      updatedAt: new Date(),
      value: 'asd'
 }})

  console.log('🔥', zz);
}

export async function getMember() {

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId: '8cee49eb-68bb-444c-8dbf-bdfa776b172a'
    },
    include: {
      user: {
        include: {
          memberPropertyValues: true
        }
      }
    }
  });

  console.log('🔥', spaceRoles[0].user.memberPropertyValues);
}

getMember()
// seedMemberProp()
// seedMemberPropValue()