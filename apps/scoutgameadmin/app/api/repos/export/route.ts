import { prisma } from '@charmverse/core/prisma-client';
import { stringify } from 'csv-stringify/sync';
import { NextResponse } from 'next/server';

const columns = ['id', 'owner', 'name', 'url'];

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await prisma.githubRepo.findMany();
  const exportString = stringify(rows, { header: true, columns });
  return NextResponse.json(exportString);
  // return new Response(exportString, {
  //   status: 200,
  //   headers: {
  //     'Content-Type': 'text/tsv',
  //     'Content-Disposition': 'attachment; filename=github_repos.tsv'
  //   }
  // });
}
