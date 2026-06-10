import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/') {
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
