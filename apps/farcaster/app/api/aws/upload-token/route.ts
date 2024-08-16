import { uploadToken } from 'lib/aws/uploadToken';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  if (typeof filename !== 'string') {
    return new Response('filename is required', { status: 400 });
  }

  try {
    const tokenData = await uploadToken(filename);

    return Response.json(tokenData);
  } catch (error) {
    return new Response(`Failed to generate S3 upload token: ${error}`, { status: 500 });
  }
}
