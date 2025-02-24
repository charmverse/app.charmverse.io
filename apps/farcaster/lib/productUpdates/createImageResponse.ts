import { getUserS3FilePath, uploadFileToS3 } from '@packages/aws/uploadToS3Server';
import { baseUrl } from '@root/config/constants';
import { ImageResponse } from 'next/og';
import React from 'react';
import type { Font } from 'satori';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';

import { ProductUpdatesFrame } from 'components/product-updates/frames/[id]/ProductUpdatesFrame';

export async function createImage(input: {
  userId: string;
  avatar: string | null;
  project: string;
  createdAtLocal: string;
  text: string;
}) {
  let projectAvatarImageUrl: string | null = input.avatar;
  const fonts = await getFonts();

  // Convert project avatar image to PNG if it's not already
  if (input.avatar && !input.avatar.endsWith('.png')) {
    const projectAvatarBlob = await fetch(input.avatar).then((res) => res.blob());
    const projectAvatarData = await projectAvatarBlob.arrayBuffer().then((buffer) => Buffer.from(buffer));
    const projectAvatarOptimizedBuffer = await sharp(projectAvatarData).png().toBuffer();
    const filenameWithoutExtension = input.avatar.split('.').slice(0, -1).join('.');
    const { fileUrl: projectAvatarFileUrl } = await uploadFileToS3({
      pathInS3: getUserS3FilePath({
        userId: input.userId,
        url: `project-avatar-${uuid()}-${filenameWithoutExtension}.png`
      }),
      content: projectAvatarOptimizedBuffer,
      contentType: 'image/png'
    });

    projectAvatarImageUrl = projectAvatarFileUrl;
  }

  const element = React.createElement(ProductUpdatesFrame, {
    text: input.text,
    createdAtLocal: input.createdAtLocal,
    projectName: input.project,
    projectAvatarImage: projectAvatarImageUrl
  });

  // Use a ratio of 1.91:1 for the image as recommended by farcaster
  return new ImageResponse(element, {
    width: 500,
    height: 500,
    fonts
  });
}

// for help retrieving fonts, see issue: https://github.com/vercel/next.js/issues/48081
async function getFonts(): Promise<Font[]> {
  const [interRegular, interSemiBold, interBold] = await Promise.all([
    fetch(`${baseUrl}/inter/static/Inter_18pt-Medium.ttf`).then((res) => res.arrayBuffer()),
    fetch(`${baseUrl}/inter/static/Inter_18pt-SemiBold.ttf`).then((res) => res.arrayBuffer()),
    fetch(`${baseUrl}/inter/static/Inter_18pt-Bold.ttf`).then((res) => res.arrayBuffer())
  ]);

  return [
    {
      name: 'Inter',
      data: interRegular,
      style: 'normal',
      weight: 400
    },
    {
      name: 'Inter',
      data: interSemiBold,
      style: 'normal',
      weight: 600
    },
    {
      name: 'Inter',
      data: interBold,
      style: 'normal',
      weight: 700
    }
  ];
}
