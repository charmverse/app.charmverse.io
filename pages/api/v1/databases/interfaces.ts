import { Page } from '@prisma/client';

export interface ApiPage extends Pick<Page, 'id' | 'createdAt' | 'type' | 'title' | 'content'> {
  url: string
}

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    BoardPage:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        createdAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        type:
 *          type: string
 *          example: board
 *        title:
 *          type: string
 *          example: Todo tracker
 *        content:
 *          type: string
 *          example: content
 *        url:
 *          type: string
 *          example: https://app.charmverse.io/my-workspace/page-5985679461310778
 */

export interface BoardPage extends ApiPage {
  type: 'board'
}

export interface Card {
  id: string
  databaseId: string
  content: string
  title: string
  isTemplate: boolean
  properties: any
}
