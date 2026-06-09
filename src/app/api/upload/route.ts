import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'watchgalore';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
