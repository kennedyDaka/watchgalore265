import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!apiKey || !apiSecret || !cloudName) {
    console.error('Missing Cloudinary env vars', { hasKey: !!apiKey, hasSecret: !!apiSecret, cloudName });
    return NextResponse.json({ error: 'Cloudinary server config missing' }, { status: 500 });
  }

  let file: File;
  let folder: string;
  try {
    const fd = await req.formData();
    const f = fd.get('file');
    if (!(f instanceof File)) {
      console.error('File field missing or not a File');
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }
    file = f;
    folder = (fd.get('folder') as string) || 'watchgalore';
  } catch (e) {
    console.error('formData parse failed:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'formData parse failed' }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = { folder, timestamp };
  const signingStr = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + apiSecret;
  const signature = crypto.createHash('sha1').update(signingStr).digest('hex');

  // Build multipart form for Cloudinary (more reliable than JSON data URI)
  const cloudBody = new FormData();
  cloudBody.append('file', file);
  cloudBody.append('api_key', apiKey);
  cloudBody.append('timestamp', String(timestamp));
  cloudBody.append('folder', folder);
  cloudBody.append('signature', signature);

  let cloudRes: Response;
  try {
    cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: cloudBody }
    );
  } catch (e) {
    console.error('Cloudinary fetch failed:', e);
    return NextResponse.json({ error: `Network error contacting Cloudinary` }, { status: 500 });
  }

  if (!cloudRes.ok) {
    const body = await cloudRes.json().catch(() => null);
    const cloudMsg = body?.error?.message || JSON.stringify(body?.error) || `Cloudinary returned ${cloudRes.status}`;
    console.error('Cloudinary API error:', cloudRes.status, cloudMsg, body);
    return NextResponse.json({ error: cloudMsg }, { status: 500 });
  }

  const data = await cloudRes.json();
  return NextResponse.json({ url: data.secure_url });
}
