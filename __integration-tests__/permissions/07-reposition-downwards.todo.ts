/* eslint-disable @typescript-eslint/no-unused-vars */
import { Space, User } from '@prisma/client';
import request from 'supertest';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { IPagePermissionToCreate, IPagePermissionWithSource } from 'lib/permissions/pages';
import { getPage, IPageWithPermissions } from 'lib/pages';

/**
 * This section is currently empty.
 *
 * We cannot reposition a page downwards into its own tree.
 *
 * When a page is repositioned, it will bring all children with it
 */
