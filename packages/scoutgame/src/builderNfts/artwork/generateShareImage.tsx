import fs from 'fs';
import path from 'path';

// Must be there otherwise React is not defined error is thrown
import React from 'react';
import type { Font } from 'satori';
import sharp from 'sharp';

import type { BuilderActivity } from '../../builders/getBuilderActivities';
import type { BuilderScouts } from '../../builders/getBuilderScouts';
import type { BuilderStats } from '../../builders/getBuilderStats';

import { BuilderShareImage } from './components/BuilderShareImage';

// fails inside of Next.js
function getAssetsFromDisk() {
  const folder = process.env.NFT_ASSETS_FOLDER || path.join(path.resolve(__dirname, '../../'), 'assets');
  const overlayFiles = fs.readdirSync(`${folder}/overlays`);
  const overlaysBase64 = overlayFiles.map((file) => {
    const filePath = path.join(`${folder}/overlays`, file);
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  });
  const noPfpAvatarFile = `${folder}/no_pfp_avatar.png`;
  const noPfpAvatarBase64 = `data:image/png;base64,${fs.readFileSync(noPfpAvatarFile).toString('base64')}`;
  const fontPath = `${folder}/fonts/K2D-Medium.ttf`;
  const fontBuffer = fs.readFileSync(fontPath);
  const font: Font = {
    name: 'K2D',
    data: fontBuffer,
    style: 'normal',
    weight: 400
  };
  return { font, noPfpAvatarBase64, overlaysBase64 };
}

async function getAssetsFromServer(baseUrl: string) {
  const overlaysBase64 = await Promise.all(
    ['scratch_reveal.png', 'rounded_square.png', 'paint_splatter.png', 'checked_corners.png'].map(async (file) => {
      const noAvatarResponse = await _getBufferFromUrl(`${baseUrl}/nft-assets/overlays/${file}`);
      return _getImageDataURI(noAvatarResponse);
    })
  );

  const noAvatarResponse = await _getBufferFromUrl(`${baseUrl}/nft-assets/no_pfp_avatar.png`);
  const noPfpAvatarBase64 = _getImageDataURI(noAvatarResponse);
  const fontBuffer = await fetch(`${baseUrl}/nft-assets/fonts/K2D-Medium.ttf`).then((res) => res.arrayBuffer());
  const font: Font = {
    name: 'K2D',
    data: fontBuffer,
    style: 'normal',
    weight: 400
  };
  return { font, noPfpAvatarBase64, overlaysBase64 };
}

function _getBufferFromUrl(url: string) {
  return fetch(url)
    .then((res) => res.blob())
    .then((blob) => blob.arrayBuffer())
    .then((buffer) => Buffer.from(buffer));
}

function _getImageDataURI(buffer: Buffer) {
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function getAssets(imageHostingBaseUrl?: string) {
  if (imageHostingBaseUrl) {
    return getAssetsFromServer(imageHostingBaseUrl);
  }
  return getAssetsFromDisk();
}

// Function to determine font size
function calculateFontSize(text: string, maxWidth: number, initialFontSize: number): number {
  const minFontSize = 12;
  let fontSize = initialFontSize;

  while (fontSize > minFontSize) {
    if (text.length * fontSize * 0.6 < maxWidth) {
      return fontSize;
    }
    fontSize -= 1;
  }

  return minFontSize;
}

export async function generateShareImage({
  imageHostingBaseUrl,
  userImage,
  activities,
  builderPrice,
  stats,
  builderScouts
}: {
  imageHostingBaseUrl?: string;
  userImage: string | null;
  activities: BuilderActivity[];
  stats: BuilderStats;
  builderScouts: BuilderScouts;
  builderPrice: bigint;
}): Promise<Buffer> {
  let avatarBuffer: Buffer | null = null;
  const size = 550;

  const { noPfpAvatarBase64 } = await getAssets(imageHostingBaseUrl);

  if (userImage) {
    const response = await fetch(userImage);
    const arrayBuffer = await response.arrayBuffer();
    avatarBuffer = await sharp(Buffer.from(arrayBuffer)).resize(150, 200).png().toBuffer();
  }

  const { ImageResponse } = await import('@vercel/og');

  const baseImage = new ImageResponse(
    (
      <BuilderShareImage
        activities={activities}
        builderScouts={builderScouts}
        stats={stats}
        nftImageUrl={avatarBuffer ? `data:image/png;base64,${avatarBuffer.toString('base64')}` : noPfpAvatarBase64}
        size={size}
        builderPrice={builderPrice}
      />
    ),
    {
      width: size,
      height: size,
      emoji: 'noto'
    }
  );

  const baseImageBuffer = await baseImage.arrayBuffer();
  const imageBuffer = await sharp(Buffer.from(baseImageBuffer)).png().toBuffer();

  return imageBuffer;
}
