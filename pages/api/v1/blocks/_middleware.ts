import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';
import { NextHandler } from 'next-connect';
import { prisma } from 'db';

export default async function middleware (req: NextRequest, res: NextResponse, next: NextHandler) {

  /*
  const apiKey = req.headers.get('Authorization') ?? req.page.params?.api_key;

  console.log('Api key', apiKey, 'process', process, 'window', window);
*/
  console.log('Executing middleware');

  return NextResponse.next();
}
