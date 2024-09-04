import { promises as fs } from 'fs';
import path from 'path';

import { log } from '@charmverse/core/log';
import sharp from 'sharp';

import { getTier } from 'lib/scoring/calculateUserPosition';

export async function GET(req: Request) {
  const query = new URL(req.url).searchParams;

  const percentile = query.get('percentile');

  // Get the path to the public folder
  let imagePath = path.resolve('apps', 'waitlist', 'public', 'images', 'waitlist', 'dev', 'waitlist-current-score.jpg');

  // Workaround for path resolution between dev and prod environment
  if (imagePath.match('apps/waitlist/apps/waitlist/')) {
    imagePath = imagePath.replace('apps/waitlist/apps/waitlist/', 'apps/waitlist/');
  }

  const tier = getTier(parseInt(percentile as string, 10));

  try {
    // Read the image file from the public folder
    const imageBuffer = await fs.readFile(imagePath);

    const svgText = `
   <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Inter';
        src: url('/Inter/variable_font.ttf') format('truetype-variations');
        font-weight: 100 900;
        font-style: normal;
      }
      .title { 
        fill: white; 
        font-size: 48px; 
        font-weight: bold;
        font-family: 'Inter', sans-serif;
      }
      .subtitle {
        fill: #C0C0C0;
        font-size: 36px;
        font-family: 'Inter', sans-serif;
      }
    </style>
  </defs>
  <text x="50%" y="30%" text-anchor="middle" class="title">Tier:</text>
  <text x="50%" y="40%" text-anchor="middle" class="subtitle">${tier.toUpperCase()}</text>
  <text x="50%" y="50%" text-anchor="middle" class="subtitle">Percentile: ${percentile}%</text>
</svg>
  `;

    const svgBuffer = Buffer.from(svgText);

    // Use sharp to process the image (resize, crop, etc.)
    const processedImage = await sharp(imageBuffer)
      .resize(600, 600) // Resize the image to 300x300 pixels
      .composite([
        {
          input: svgBuffer,
          top: 0,
          left: 0
        }
      ])
      // .grayscale() // Apply grayscale filter
      .toFormat('png') // Convert the image to PNG format
      .toBuffer(); // Return the image as a buffer

    const response = new Response(processedImage, { headers: { 'Content-Type': 'image/png' }, status: 200 });

    return response;
  } catch (error) {
    log.error('Error processing image', { error });
    return new Response('Error processing image', { status: 500 });
  }
}
