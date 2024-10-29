import fs from 'fs';
import path from 'path';

import { ImageResponse } from 'next/og';
// Must be there otherwise React is not defined error is thrown
import React from 'react';
import type { Font } from 'satori';
import sharp from 'sharp';

// fails inside of Next.js
function getAssetsFromDisk() {
  const OVERLAY_FOLDER = path.join(path.resolve(__dirname, '../../'), 'assets', 'overlays');
  const overlayFiles = fs.readdirSync(OVERLAY_FOLDER);
  const overlaysBase64 = overlayFiles.map((file) => {
    const filePath = path.join(OVERLAY_FOLDER, file);
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  });
  const noPfpAvatarFile = path.join(path.resolve(__dirname, '../../'), 'assets', 'no_pfp_avatar.png');
  const noPfpAvatarBase64 = `data:image/png;base64,${fs.readFileSync(noPfpAvatarFile).toString('base64')}`;
  const fontPath = path.join(path.resolve(__dirname, '../../'), 'assets', 'fonts', 'K2D-Medium.ttf');
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

export async function generateNftImage({
  avatar,
  displayName,
  imageHostingBaseUrl
}: {
  avatar: string | null;
  displayName: string;
  imageHostingBaseUrl?: string; // when running inside of next.js, we need to use the server url
}): Promise<Buffer> {
  const { overlaysBase64, noPfpAvatarBase64, font } = await getAssets(imageHostingBaseUrl);
  const randomOverlay = overlaysBase64[Math.floor(Math.random() * overlaysBase64.length)];
  let avatarBuffer: Buffer | null = null;
  const cutoutWidth = 300;
  const cutoutHeight = 400;

  if (avatar) {
    const response = await fetch(avatar);
    const arrayBuffer = await response.arrayBuffer();
    avatarBuffer = await sharp(Buffer.from(arrayBuffer)).resize(300, 300).png().toBuffer();
  }

  const baseImage = new ImageResponse(
    (
      <div
        style={{
          height: cutoutHeight,
          width: cutoutWidth,
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          backgroundColor: 'white'
        }}
      >
        <img
          src={avatarBuffer ? `data:image/png;base64,${avatarBuffer.toString('base64')}` : noPfpAvatarBase64}
          style={{
            width: 300,
            height: 300
          }}
        />
        <img
          src={randomOverlay}
          width={cutoutWidth}
          height={cutoutHeight}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'row',
            bottom: 40,
            position: 'absolute',
            paddingLeft: 10,
            paddingRight: 10
          }}
        >
          <p
            style={{
              color: 'white',
              textAlign: 'center',
              fontSize: `${calculateFontSize(displayName, 280, 24)}px`,
              whiteSpace: 'nowrap',
              maxWidth: `${280}px`,
              fontFamily: 'K2D'
            }}
          >
            {displayName}
          </p>
        </div>
      </div>
    ),
    {
      width: cutoutWidth,
      height: cutoutHeight,
      fonts: [font]
    }
  );

  const baseImageBuffer = await baseImage.arrayBuffer();
  const imageBuffer = sharp(Buffer.from(baseImageBuffer)).png().toBuffer();

  return imageBuffer;
}

export async function generateNftCongrats({
  imageHostingBaseUrl,
  userImage
}: {
  imageHostingBaseUrl?: string;
  userImage: string | null;
}): Promise<Buffer> {
  let avatarBuffer: Buffer | null = null;
  const cutoutWidth = 400;
  const cutoutHeight = 400;

  const { noPfpAvatarBase64 } = await getAssets(imageHostingBaseUrl);

  if (userImage) {
    const response = await fetch(userImage);
    const arrayBuffer = await response.arrayBuffer();
    avatarBuffer = await sharp(Buffer.from(arrayBuffer)).resize(150, 200).png().toBuffer();
  }

  const baseImage = new ImageResponse(
    (
      <div
        style={{
          backgroundColor: '#000',
          height: cutoutHeight,
          width: cutoutWidth,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '8px',
          backgroundImage: `url(${process.env.DOMAIN}/images/profile/congrats-bg.jpg)`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        <img
          src={avatarBuffer ? `data:image/png;base64,${avatarBuffer.toString('base64')}` : noPfpAvatarBase64}
          alt='user nft'
          width={150}
          height={200}
        />
      </div>
    ),
    {
      width: cutoutWidth,
      height: cutoutHeight
    }
  );

  const baseImageBuffer = await baseImage.arrayBuffer();
  const imageBuffer = sharp(Buffer.from(baseImageBuffer)).png().toBuffer();

  return imageBuffer;
}
