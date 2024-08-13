export async function POST(req: Request, res: Response) {
  console.log(
    'POST /waitlist',
    JSON.parse(
      (await req.body
        ?.getReader()
        .read()
        .then((r) => new TextDecoder().decode(r.value))) as any
    )
  );

  return new Response(`Success`, { status: 200 });
}
