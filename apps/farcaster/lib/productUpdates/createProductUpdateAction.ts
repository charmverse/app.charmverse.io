'use server';

import type { ProductUpdatesFarcasterFrame, Project } from '@charmverse/core/prisma-client';
import { actionClient } from '@packages/nextjs/actions/actionClient';

import { createProductUpdate } from './createProductUpdate';
import { schema } from './schema';

export const createProductUpdateAction = actionClient
  .metadata({ actionName: 'create_product_update' })
  .schema(schema)
  .action<{
    productUpdatesFrame: ProductUpdatesFarcasterFrame;
    project: Pick<Project, 'name'>;
  }>(async ({ parsedInput }) => {
    const productUpdatesFrame = await createProductUpdate(parsedInput);
    return productUpdatesFrame;
  });
