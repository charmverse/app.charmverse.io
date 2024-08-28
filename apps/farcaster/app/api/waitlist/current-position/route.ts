import { promises as fs } from 'fs';
import path from 'path';

// Use dynamic import for sharp as it's a CommonJS module
import sharp from 'sharp';

export async function GET(req: Request) {
  const query = new URL(req.url).searchParams;

  // console.log('FID', query.get('fid'));

  // Get the path to the public folder
  const imagePath = path.join(process.cwd(), 'public', 'images', 'waitlist', 'dev', 'waitlist-current-score.jpg');

  try {
    // Read the image file from the public folder
    const imageBuffer = await fs.readFile(imagePath);

    const svgText = `
    <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { 
          fill: white; 
          font-size: 48px; 
          font-weight: bold;
          font-family: Arial, sans-serif;
        }
        .subtitle {
          fill: #C0C0C0;
          font-size: 36px;
          font-family: Arial, sans-serif;
        }
      </style>
      <text x="50%" y="30%" text-anchor="middle" class="title">Tier:</text>
      <text x="50%" y="40%" text-anchor="middle" class="subtitle">COMMON</text>
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
