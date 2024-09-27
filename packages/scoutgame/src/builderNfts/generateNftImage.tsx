import fs from 'fs';
import path from 'path';

import { ImageResponse } from 'next/og';
import React from 'react';
import sharp from 'sharp';

const OVERLAY_FOLDER = path.join(path.resolve(__dirname, '../'), 'public', 'overlays');
const overlayFiles = fs.readdirSync(OVERLAY_FOLDER);
const overlaysBase64 = overlayFiles.map((file) => {
  const filePath = path.join(OVERLAY_FOLDER, file);
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString('base64')}`;
});
const noPfpAvatarFile = path.join(path.resolve(__dirname, '../'), 'public', 'no_pfp_avatar.png');
const noPfpAvatarBase64 = `data:image/png;base64,${fs.readFileSync(noPfpAvatarFile).toString('base64')}`;

export async function generateNftImage({
  avatar,
  username
}: {
  avatar: string | null;
  username: string;
}): Promise<Buffer> {
  const randomOverlay = overlaysBase64[Math.floor(Math.random() * overlaysBase64.length)];
  const baseImage = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          position: 'relative'
        }}
      >
        <img src={noPfpAvatarBase64} width={300} height={400} />
        <img src={randomOverlay} width={300} height={400} style={{ position: 'absolute', top: 0, left: 0 }} />
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'row',
            top: 300,
            position: 'absolute',
            flexWrap: 'wrap',
            paddingLeft: 10,
            paddingRight: 10
          }}
        >
          <p
            style={{
              whiteSpace: 'wrap',
              color: 'white',
              textAlign: 'center'
            }}
          >
            {username}
          </p>
        </div>
      </div>
    ),
    {
      width: 300,
      height: 400
    }
  );

  // Step 3: Convert ImageResponse to Buffer
  const baseImageBuffer = await baseImage.arrayBuffer();

  // Step 4: Use sharp to overlay images
  const image = sharp(Buffer.from(baseImageBuffer)).png();

  // Step 5: Generate final image buffer
  const finalImageBuffer = await image.toBuffer();

  return finalImageBuffer;
}

generateNftImage({
  avatar: null,
  username: 'test'
}).then((buffer) => {
  fs.writeFileSync('test.png', new Uint8Array(buffer));
});
