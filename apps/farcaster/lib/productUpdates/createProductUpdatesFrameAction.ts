'use server';

import type { ProductUpdatesFarcasterFrame, Project } from '@charmverse/core/prisma-client';
import { actionClient } from '@connect-shared/lib/actions/actionClient';

import { createProductUpdatesFrame } from './createProductUpdatesFrame';
import { schema } from './schema';

export const createProductUpdatesFrameAction = actionClient
  .metadata({ actionName: 'create_product_update' })
  .schema(schema)
  .action<{
    productUpdatesFrame: ProductUpdatesFarcasterFrame;
    project: Pick<Project, 'name'>;
  }>(async ({ parsedInput }) => {
    const productUpdatesFrame = await createProductUpdatesFrame(parsedInput);
    return productUpdatesFrame;
  });
