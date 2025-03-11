import { uploadToken } from '@packages/aws/uploadToken';
import { getSession } from '@packages/connect-shared/lib/session/getSession';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const session = await getSession();
  const userId = session.user?.id;

  if (!userId) {
    return new Response(`Unauthorized`, { status: 401 });
  }
  if (typeof filename !== 'string') {
    return new Response('filename is required', { status: 400 });
  }

  try {
    const tokenData = await uploadToken({ filename, userId });

    return Response.json(tokenData);
  } catch (error: any) {
    return new Response(`Failed to generate S3 upload token. error: ${JSON.stringify(error)}`, {
      status: error?.code || 500
    });
  }
}
