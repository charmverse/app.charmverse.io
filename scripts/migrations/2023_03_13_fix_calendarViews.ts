import { prisma } from 'db';
import { BoardFields } from 'lib/focalboard/board';
import { CardFields } from 'lib/focalboard/card';
import { IDType, Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import type { Board, IPropertyOption, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';

async function init() {

  const views = await prisma.block.findMany({
    where: {
      type: "view",
      fields: {
        path: ['viewType'],
        equals: 'calendar'
      }
    }
  })
  let counts = { views: views.length, needsDate: 0 };
  for (let view of views) {
    if (!(view.fields as any)?.dateDisplayPropertyId) {
        counts.needsDate++;

      const template: IPropertyTemplate = {
        id: Utils.createGuid(IDType.BlockID),
        name: 'Date',
        type: 'date',
        options: []
      };
      const board = await prisma.block.findUnique({
        where: {
          id: view.parentId
        }
      }) as unknown as Board;
      const boardFields = board.fields as any;
      boardFields.cardProperties.push(template);
      const viewFields = view.fields as any;
      viewFields.dateDisplayPropertyId = template.id;
      await prisma.$transaction([
          prisma.block.update({
          where: {
            id: board.id
          },
          data: {
            fields: boardFields
          }
        }),
        prisma.block.update({
          where: {
            id: view.id
          },
          data: {
            fields: viewFields
          }
        })
      ])
    }
  }
  console.log('complete', counts)
}

init();