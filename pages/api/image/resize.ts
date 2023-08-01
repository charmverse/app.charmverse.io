import fs from 'fs/promises';
import { join } from 'path';

import { log } from '@charmverse/core/log';
import formidable from 'formidable';
import { DateTime } from 'luxon';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import sharp from 'sharp';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(resizeImage);

async function resizeImage(req: NextApiRequest, res: NextApiResponse) {
  const uploadDir = join(process.env.ROOT_DIR || process.cwd(), `/uploads/${DateTime.now().toFormat('dd-MM-YYY')}`);

  try {
    await fs.stat(uploadDir);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(uploadDir, { recursive: true });
    } else {
      log.error('Failed to create upload directory', { error });
    }
  }

  const form = formidable({
    uploadDir,
    maxFileSize: 20 * 1024 * 1024, // 20MB
    filter: (part) => {
      return part.name === 'uploadedFile' && (part.mimetype?.includes('image') || false);
    }
  });
  const [, files] = await form.parse(req);
  if (files && files.uploadedFile) {
    const image = Array.isArray(files.uploadedFile) ? files.uploadedFile[0] : files.uploadedFile;
    // Convert a formidable.File to a Buffer
    const imageBuffer = await fs.readFile(image.filepath);
    const optimizedBuffer = await sharp(imageBuffer)
      .resize({
        withoutEnlargement: true,
        width: 280
      })
      .webp({ quality: 80 })
      .toBuffer();

    res.status(200);
    res.setHeader('Content-Type', 'image/webp');
    res.send(optimizedBuffer);
  } else {
    res.status(400).end();
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};

export default withSessionRoute(handler);
