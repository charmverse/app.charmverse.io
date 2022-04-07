import { Page } from '@prisma/client';

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    CardProperty:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        name:
 *          type: string
 *          example: Status
 *        type:
 *          type: string
 *          example: select
 *        options:
 *          required: false
 *          type: array
 *          items:
 *            type: object
 *            properties:
*               id:
*                 type: string
*                 example: a6f7c9ac-d660-44ba-a64a-3198e012277f
*               color:
*                 type: string
*                 example: propColorGreen
*               value:
*                 type: string
*                 example: Complete
*/

export interface CardProperty {
  id: string;
  name: string
  type: string
  options: {
    id: string
    color: string
    value: string
  } []
}

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
 *        schema:
 *          type: array
 *          items:
 *            type: object
 *            $ref: '#/components/schemas/CardProperty'
 *
 */

export interface BoardPage extends ApiPage {
  type: 'board'
}

/**
 * @swagger
 *  components:
 *  schemas:
 *    CardContentFormats:
 *      type: object
 *      properties:
 *        markdown:
 *          type: string
 *          example: Markdown content as a string
*/
export interface CardContentFormats {
  markdown: string;
}

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    Card:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        databaseId:
 *          type: string
 *          format: uuid
 *          example: 4e22cad9-8025-4e47-91dc-e37501c0ec71
 *        createdAt:
 *          type: string
 *          format: date-time
 *          example: 2022-03-04T21:32:38.317Z
 *        updatedAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-02T07:22:31.097Z
 *        title:
 *          type: object
 *            properties
 *          example: Finalise community guidelines
 *        content:
 *          type: object
 *          $ref: '#/components/schemas/CardContentFormats'
 *        isTemplate:
 *          type: string
 *          example: false
 *        cardProperties:
 *           type: object
 *           properties:
 *              Status:
 *                type: string
 *                example: In Progress
 *              Priority:
 *                type: string
 *                example: Medium
 *
 */
export interface Card {
  id: string
  createdAt: string
  updatedAt: string
  databaseId: string
  content: CardContentFormats
  title: string
  isTemplate: boolean
  cardProperties: Record<string, string | number>
}

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    CardQuery:
 *      type: object
 *      properties:
 *        title:
 *          type: string
 *          example: grants
 *          required: false
 *        cardProperties:
 *          type: object
 *          required: false
 *          properties:
 *            Status:
 *              type: string
 *              example: Complete
 *              required: false
 *            Priority:
 *              type: string
 *              example: High
 *              required: false
 *
 */
export type CardQuery = Partial<Pick<Card, 'title' | 'cardProperties'>>

/**
 *
 * @property cursor undefined if hasNext is false
 */
export interface PaginatedResponse<T> {
  data: T[]
  hasNext: boolean
  cursor?: string
}

export type PaginatedQuery<T> = T & {
  cursor?: string
  limit?: number
}
