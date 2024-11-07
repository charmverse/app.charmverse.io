import { NextResponse } from 'next/server';

// This API Route is non-blocking and called on every page load. Use it to refresh things about the current user
export async function GET() {
  return NextResponse.json({});
}
