import type { Prisma } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';

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
  count,
  spaceId,
  createdBy,
  categoryId,
  content = { type: 'doc', content: [] },
  contentText = '',
  title,
  withImageRatio = 30
}: {
  spaceId: string;
  createdBy: string;
  count: number;
  categoryId?: string;
  content?: any;
  contentText?: string;
  title?: string;
  withImageRatio?: number;
}): Promise<ForumPostPage[]> {
  const postCreateInputs: Prisma.PostCreateManyInput[] = [];
  const pageCreateInputs: Prisma.PageCreateManyInput[] = [];

  // Start creating the posts 3 days ago
  let createdAt = Date.now() - 1000 * 60 * 60 * 24 * 30;

  for (let i = 0; i < count; i++) {
    const postInput: Prisma.PostCreateManyInput = {
      status: 'published',
      categoryId,
      id: v4()
    };

    postCreateInputs.push(postInput);

    const postDate = new Date(createdAt);

    // eslint-disable-next-line prettier/prettier
    const hasImage = (Math.random() * 100) < withImageRatio;

    pageCreateInputs.push({
      id: postInput.id,
      spaceId,
      contentText,
      content,
      title: `${title ?? 'Post'} ${i}`,
      createdBy,
      updatedBy: createdBy,
      type: 'post',
      path: `path-${v4()}`,
      postId: postInput.id,
      galleryImage: hasImage ? getRandomImage() : undefined,
      createdAt: postDate,
      updatedAt: postDate
    });

    // Space posts apart by 30 minutes
    createdAt += 1000 * 60 * 30;
  }

  await prisma.post.createMany({ data: postCreateInputs });
  await prisma.page.createMany({ data: pageCreateInputs });

  return prisma.page.findMany({
    where: {
      spaceId,
      type: 'post',
      postId: {
        in: postCreateInputs.map((post) => post.id as string)
      }
    },
    include: {
      post: true
    }
  }) as Promise<ForumPostPage[]>;
}
