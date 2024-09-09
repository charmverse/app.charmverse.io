import { JoinWaitlistHomeFrame } from 'components/frame/JoinWaitlistHome';

export async function GET(req: Request, res: Response) {
  const fid = new URL(req.url).pathname.split('/')[3];

  const frame = JoinWaitlistHomeFrame({ referrerFid: fid });

  return new Response(frame, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}
