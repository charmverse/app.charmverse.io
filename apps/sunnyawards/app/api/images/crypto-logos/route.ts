import fs from 'node:fs/promises';
import path from 'node:path';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const logo = searchParams.get('logo');

  // Validate and sanitize the input
  if (!logo || !/^[a-zA-Z0-9-_]+\.(svg|png)$/.test(logo as string)) {
    return new Response(`Invalid logo parameter`, { status: 400 });
  }

  // Construct the path to the image within the allowed directory

  const filePath = path.join(process.cwd(), '../../public/images/cryptoLogos', logo as string);

  try {
    // Ensure the resolved path is within the intended directory
    const resolvedPath = path.resolve(filePath);
    const allowedDir = path.resolve(path.join(process.cwd(), '../../public/images/cryptoLogos'));

    if (!resolvedPath.startsWith(allowedDir)) {
      return new Response(`Access denied`, { status: 403 });
    }

    // Read the image file
    const image = await fs.readFile(resolvedPath);

    // Determine the content type
    const ext = path.extname(logo as string).substring(1);
    let contentType;
    switch (ext) {
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      default:
        return new Response(`Unsupported file type`, { status: 400 });
    }

    const response = new Response(image, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-max-age=86400, immutable',
        Vary: ''
      }
    });

    return response;
  } catch (error) {
    return new Response(`Image not found`, { status: 404 });
  }
}
