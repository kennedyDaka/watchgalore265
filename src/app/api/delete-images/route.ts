import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    return NextResponse.json({ error: 'Cloudinary server config missing' }, { status: 500 });
  }

  let urls: string[];
  try {
    const body = await req.json();
    urls = body.urls as string[];
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'urls must be a non-empty array' }, { status: 400 });
  }

  const results: { url: string; success: boolean; error?: string }[] = [];

  for (const url of urls) {
    try {
      const publicId = extractPublicId(url, cloudName);
      if (!publicId) {
        results.push({ url, success: false, error: 'Could not extract public_id' });
        continue;
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const signStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(signStr).digest('hex');

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        { method: 'POST', body: formData }
      );

      const data = await res.json();
      if (data.result === 'ok') {
        results.push({ url, success: true });
      } else {
        results.push({ url, success: false, error: data.result || data.error?.message || 'Unknown error' });
      }
    } catch (e) {
      results.push({ url, success: false, error: e instanceof Error ? e.message : 'Request failed' });
    }
  }

  const allOk = results.every(r => r.success);
  return NextResponse.json({ results }, { status: allOk ? 200 : 207 });
}

function extractPublicId(url: string, cloudName: string): string | null {
  const escapedCloudName = cloudName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `https://res\\.cloudinary\\.com/${escapedCloudName}/image/upload/(?:v\\d+/)?(.+?)(?:\\.\\w+)?(?:\\?.*)?$`
  );
  const match = url.match(pattern);
  return match ? match[1] : null;
}
