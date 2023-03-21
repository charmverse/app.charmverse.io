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
  }[];
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
export interface DatabasePage
  extends Pick<PrismaPage, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'title' | 'spaceId'> {
  url: string;
  type: 'board';
  schema: PageProperty[];
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
 *    CardPage:
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
export interface CardPage {
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
 *    CardPageQuery:
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
export type CardPageQuery = Partial<Pick<CardPage, 'title' | 'properties'>>;

/**
 *
 * @property cursor undefined if hasNext is false
 */
export interface PaginatedResponse<T> {
  data: T[];
  hasNext: boolean;
  // Can be a cursor or a page number depending on pagination method
  cursor?: string | number;
}

export type PaginatedQuery<T> = {
  cursor?: string;
  limit?: number;
  query: T;
};

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    Workspace:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        name:
 *          type: string
 *          example: Test DAO Space
 *        domain:
 *          type: string
 *          example: test-dao-space
 *        createdAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        updatedAt:
 *          type: string
 *          format: date-time
 *          example: 2022-04-04T21:32:38.317Z
 *        createdBy:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        updatedBy:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        discordServerId:
 *          type: string
 *          example: 260918243123345408
 *        spaceImage:
 *          type: string
 *          example: https://s3.amazonaws.com/charm.public/user-content/test/logo.jpg
 *        defaultPublicPages:
 *          type: boolean
 *          example: false
 *        publicBountyBoard:
 *          type: boolean
 *          example: false
 */

export interface Workspace {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  discordServerId: string;
  spaceImage: string | null;
  defaultPublicPages: boolean;
  publicBountyBoard: boolean;
}

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    CreateWorkspaceRequestBody:
 *      required:
 *        - name
 *        - discordServerId
 *        - adminDiscordUserId
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *          example: Test DAO Space
 *        discordServerId:
 *          required: false
 *          type: string
 *          example: 260918243123345408
 *        adminDiscordUserId:
 *          required: false
 *          type: string
 *          example: 260918243123345408
 *        adminWalletAddress:
 *          required: false
 *          type: string
 *          example: 0x7684F0170a3B37640423b1CD9d8Cb817Edf301aE
 *        xpsEngineId:
 *          required: false
 *          type: string
 *        avatar:
 *          required: false
 *          type: url
 *          example: https://s3.amazonaws.com/charm.public/user-content/test/logo.jpg
 */
export interface CreateWorkspaceRequestBody {
  name: string;
  discordServerId?: string;
  adminDiscordUserId?: string;
  xpsEngineId?: string;
  adminWalletAddress?: string;
  adminAvatar?: string;
  adminUsername?: string;
  webhookUrl?: string;
  avatar?: string;
}

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    CreateWorkspaceResponseBody:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        spaceUrl:
 *          type: url
 *          example: https://app.charmverse.io/test-dao-space
 *        joinUrl:
 *          type: url
 *          example: https://app.charmverse.io/join?domain=test-dao-space
 */
export interface CreateWorkspaceResponseBody {
  id: string;
  spaceUrl: string;
  joinUrl: string;
  webhookSigningSecret?: string;
}

export type UserProfile = {
  id: string;
  avatar: string | null;
  wallet: string;
  username: string;
  email: string;
};
