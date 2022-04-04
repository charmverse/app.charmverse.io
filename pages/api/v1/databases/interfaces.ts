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
 *        createdAt:
 *          type: string
 *          format: date-time
 *        type:
 *          type: string
 *        title:
 *          type: string
 *        content:
 *          type: string
 *        url:
 *          type: string

 */

/*
 *     example:
 *        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
*         createdAt: '2022-04-04T21:32:38.317Z',
*         type: 'board',
*         title: 'Todo tracker',
*         content: 'string',
*         url: 'https://app.charmverse.io/page-5985679461310778'
*/

export interface ApiBoard extends ApiPage {
  type: 'board',
  properties: {
    type: string;
    title: string
  }
}
