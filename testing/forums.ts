import type { Post, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { generatePostCategory } from './utils/forums';

const imageUrl1 =
  'https://media.wtsp.com/assets/WTSP/images/657c2b38-486d-467b-8f35-ba1014ff5c61/657c2b38-486d-467b-8f35-ba1014ff5c61.png';
const imageUrl2 =
  'https://www.teslarati.com/wp-content/uploads/2019/04/Falcon-9-by-land-and-by-sea-CRS-13-Eshail-2-B1047-SpaceX-1-c.jpg';
const imageUrl3 =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Tharsis_and_Valles_Marineris_-_Mars_Orbiter_Mission_%2830055660701%29.png/440px-Tharsis_and_Valles_Marineris_-_Mars_Orbiter_Mission_%2830055660701%29.png';
const imageUrl4 = 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Astronaut-in-space.jpg';
const imageUrl5 = 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Hubble_Ultra_Deep_Field_part_d.jpg';

const images = [imageUrl1, imageUrl2, imageUrl3, imageUrl4, imageUrl5];

function getRandomImage() {
  return images[Math.min(images.length - 1, Math.round(Math.random() * images.length))];
}

export async function generateForumPosts({
  categoryId,
  count,
  spaceId,
  createdBy,
  content = { type: 'doc', content: [] },
  contentText = '',
  title,
  isDraft,
  withImageRatio = 30
}: {
  isDraft?: boolean;
  spaceId: string;
  categoryId?: string;
  createdBy: string;
  count: number;
  content?: any;
  contentText?: string;
  title?: string;
  withImageRatio?: number;
}): Promise<Post[]> {
  const postCreateInputs: Prisma.PostCreateManyInput[] = [];

  if (!categoryId) {
    const category = await prisma.postCategory.findFirst({
      where: {
        spaceId
      }
    });
    if (!category) {
      const newCategory = await generatePostCategory({ spaceId });
      categoryId = newCategory.id;
    } else {
      categoryId = category.id;
    }
  }

  // Start creating the posts 3 days ago
  let createdAt = Date.now() - 1000 * 60 * 60 * 24 * 30;

  for (let i = 0; i < count; i++) {
    const postDate = new Date(createdAt);

    postCreateInputs.push({
      id: v4(),
      spaceId,
      categoryId,
      contentText,
      content,
      title: `${title ?? 'Post'} ${i}`,
      createdBy,
      path: `path-${v4()}`,
      createdAt: postDate,
      updatedAt: postDate,
      isDraft
    });

    // Space posts apart by 30 minutes
    createdAt += 1000 * 60 * 30;
  }

  await prisma.post.createMany({ data: postCreateInputs });

  const posts = await prisma.post.findMany({
    where: {
      id: {
        in: postCreateInputs.map((post) => post.id as string)
      }
    }
  });
  return posts;
}
