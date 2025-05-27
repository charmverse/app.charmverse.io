import type { Page as PrismaPage } from '@charmverse/core/prisma';
import type { IPropertyTemplate, PropertyType } from '@packages/databases/board';
import type { APISpaceTemplateType } from '@packages/spaces/config';
import type { ProposalType } from '@snapshot-labs/snapshot.js/dist/sign/types';

export type BoardPropertyValue = string | string[] | number | null | boolean | Record<string, unknown>;

/**
 * @swagger
 * components:
 *  schemas:
 *    UserProfile:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        avatar:
 *          type: string
 *          example: https://google.com/image.png
 *        wallet:
 *          type: string
 *          example: '0x7684F0170a3B37640423b1CD9d8Cb817Edf301aE'
 *        username:
 *          type: string
 *          example: testuser
 *        email:
 *          type: string
 *          example: johndoe@gmail.com
 */

export type UserProfile = {
  id: string;
  avatar: string | null;
  wallet: string;
  username: string;
  email: string;
};

/**
 * @swagger
 * components:
 *  schemas:
 *    PagePropertyOption:
 *     type: object
 *     properties:
 *      id:
 *        type: string
 *        example: a6f7c9ac-d660-44ba-a64a-3198e012277f
 *      color:
 *        type: string
 *        example: propColorTeal
 *      value:
 *        type: string
 *        example: Complete
 */
export interface PagePropertyOption {
  id: string;
  color: string;
  value: string;
}

/**
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
 *          type: array
 *          items:
 *            type: object
 *            $ref: '#/components/schemas/PagePropertyOption'
 */
export type PageProperty<T extends PropertyType = PropertyType> = Pick<IPropertyTemplate, 'id' | 'name'> &
  Partial<Pick<IPropertyTemplate, 'description'>> & {
    type: T;
    options?: T extends 'select' | 'multiSelect' ? PagePropertyOption[] : undefined;
  } & (T extends 'select' | 'multiSelect' ? { options: PagePropertyOption[] } : {});

/**
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
export type CardPage = {
  id: string;
  createdAt: string;
  updatedAt: string;
  databaseId: string;
  spaceId: string;
  content: PageContentFormats;
  title: string;
  isTemplate: boolean;
  properties: Record<string, BoardPropertyValue>;
};

/**
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
 * @swagger
 * components:
 *  schemas:
 *    CardPageCreationData:
 *      type: object
 *      properties:
 *        title:
 *          type: string
 *          example: grants
 *          required: true
 *        contentMarkdown:
 *          type: string
 *          example: Markdown title content
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
export type CardPageCreationData = {
  title: string;
  properties?: Record<string, BoardPropertyValue>;
  contentMarkdown?: string;
};

/**
 * @swagger
 * components:
 *  schemas:
 *    CardPageUpdateData:
 *      type: object
 *      properties:
 *        title:
 *          type: string
 *          example: Grants - Summer
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
export type CardPageUpdateData = {
  title?: string;
  properties?: Record<string, BoardPropertyValue>;
};

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
  query?: T;
};

/**
 * @swagger
 * components:
 *  schemas:
 *    PaginatedCardPageQuery:
 *      type: object
 *      properties:
 *         limit:
 *           type: integer
 *           required: false
 *           example: 10
 *         cursor:
 *           type: string
 *           required: false
 *           example: e63758e2-de17-48b2-9c74-5a40ea5be761
 *         query:
 *           type: object
 *           $ref: '#/components/schemas/CardPageQuery'
 */
export type PaginatedCardPageQuery = PaginatedQuery<CardPageQuery>;

/**
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
 * @swagger
 * components:
 *  schemas:
 *    CreateWorkspaceRequestBody:
 *      required:
 *        - name
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
 *        template:
 *          required: false
 *          type: string
 *          example: nft_community
 *          enum: [nft_community, impact_community, hackathon, nounish_dao, creator]
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
  template?: APISpaceTemplateType;
}

/**
 * @swagger
 * components:
 *  schemas:
 *    Space:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *        avatar:
 *          type: string
 *          example: https://google.com/image.png
 *        createdAt:
 *          type: string
 *          example: 2023-04-28T21:43:41.388Z
 *        name:
 *          type: string
 *          example: Test DAO Space
 *        spaceUrl:
 *          type: url
 *          example: https://app.charmverse.io/test-dao-space
 *        joinUrl:
 *          type: url
 *          example: https://app.charmverse.io/join?domain=test-dao-space
 */
export interface SpaceApiResponse {
  id: string;
  createdAt: string;
  createdBy: string;
  name: string;
  avatar?: string;
  spaceUrl: string;
  joinUrl: string;
}

/**
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
export interface CreateWorkspaceResponseBody extends SpaceApiResponse {
  webhookSigningSecret?: string;
}

/**
 * @example https://github.com/jellydn/next-swagger-doc/blob/main/example/models/organization.ts
 *
 * @swagger
 * components:
 *  schemas:
 *    SnapshotProposalVoteMessage:
 *      required:
 *        - space
 *        - proposal
 *        - type
 *        - choice
 *      type: object
 *      properties:
 *        space:
 *          type: string
 *        proposal:
 *          type: string
 *        type:
 *          type: string
 *          enum: [single-choice, approval, quadratic, ranked-choice, weighted, basic]
 *        choice:
 *          type: string
 *          example: Abstain
 */
export interface SnapshotProposalVoteMessage {
  space: string;
  proposal: string;
  type: ProposalType;
  choice: string | number;
}

/**
 * @swagger
 * components:
 *  schemas:
 *    SnapshotProposalVoteType:
 *      type: object
 *      properties:
 *        Vote:
 *          type: array
 *          items:
 *            type: object
 *            properties:
 *              name:
 *                type: string
 *              type:
 *                type: string
 */
export type SnapshotProposalVoteType = Record<string, any[]>;
