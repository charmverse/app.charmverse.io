import type { Page as PrismaPage } from '@prisma/client';

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    PageProperty:
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
*                 example: propColorTeal
*               value:
*                 type: string
*                 example: Complete
*/

export interface PageProperty {
  id: string;
  name: string;
  type: string;
  options: {
    id: string;
    color: string;
    value: string;
  } [];
}

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    DatabasePage:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        spaceId:
 *          type: string
 *          format: uuid
 *          example: 12c419f4-017e-4696-b8e9-ca3079b32428
 *        createdAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        updatedAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        type:
 *          type: string
 *          example: board
 *        title:
 *          type: string
 *          example: Todo tracker
 *        url:
 *          type: string
 *          example: https://app.charmverse.io/my-workspace/page-5985679461310778
 *        schema:
 *          type: array
 *          items:
 *            type: object
 *            $ref: '#/components/schemas/PageProperty'
 *
 */
export interface DatabasePage extends Pick<PrismaPage, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'title' | 'spaceId'> {
  url: string;
  type: 'board';
  schema: PageProperty [];
}

/**
 * @swagger
 *  components:
 *  schemas:
 *    PageContentFormats:
 *      type: object
 *      properties:
 *        markdown:
 *          type: string
 *          example: Markdown content as a string
*/
export interface PageContentFormats {
  markdown: string;
}

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    Page:
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
 *          type: string
 *          example: Finalise community guidelines
 *        content:
 *          type: object
 *          $ref: '#/components/schemas/PageContentFormats'
 *        isTemplate:
 *          type: boolean
 *          example: false
 *        properties:
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
export interface Page {
  id: string;
  createdAt: string;
  updatedAt: string;
  databaseId: string;
  spaceId: string;
  content: PageContentFormats;
  title: string;
  isTemplate: boolean;
  properties: Record<string, string | number>;
}

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    PageQuery:
 *      type: object
 *      properties:
 *        title:
 *          type: string
 *          example: grants
 *          required: false
 *        properties:
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
export type PageQuery = Partial<Pick<Page, 'title' | 'properties'>>

/**
 *
 * @property cursor undefined if hasNext is false
 */
export interface PaginatedResponse<T> {
  data: T[];
  hasNext: boolean;
  cursor?: string;
}

export type PaginatedQuery<T> = {
  cursor?: string;
  limit?: number;
  query: T;
}
