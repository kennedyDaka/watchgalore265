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

  let buffer: Buffer;
  try {
    const bytes = await file.arrayBuffer();
    buffer = Buffer.from(bytes);
  } catch (e) {
    console.error('arrayBuffer failed:', e);
    return NextResponse.json({ error: 'file read failed' }, { status: 500 });
  }

  // Base64-encode the file so we send it as a data URI (avoids multipart issues)
  const base64 = buffer.toString('base64');
  const dataUri = `data:${file.type || 'image/png'};base64,${base64}`;

  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = { folder, timestamp };
  const signingStr = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + apiSecret;
  const signature = crypto.createHash('sha1').update(signingStr).digest('hex');

  const uploadBody = JSON.stringify({
    file: dataUri,
    api_key: apiKey,
    timestamp,
    folder,
    signature,
  });

  let cloudRes: Response;
  try {
    cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: uploadBody }
    );
  } catch (e) {
    console.error('Cloudinary fetch failed:', e);
    return NextResponse.json({ error: `Network error contacting Cloudinary` }, { status: 500 });
  }

  if (!cloudRes.ok) {
    const body = await cloudRes.json().catch(() => null);
    const msg = body?.error?.message || `Cloudinary returned ${cloudRes.status}`;
    console.error('Cloudinary API error:', cloudRes.status, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const data = await cloudRes.json();
  return NextResponse.json({ url: data.secure_url });
}
