import { JoinWaitlistFrame } from 'components/frame/JoinWaitlistFrame';

export async function GET(req: Request) {
  const fid = new URL(req.url).pathname.split('/')[3];

  const frame = JoinWaitlistFrame({ referrerFid: fid });

  return new Response(frame, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}
