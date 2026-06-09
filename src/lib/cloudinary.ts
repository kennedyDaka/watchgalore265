export async function uploadToCloudinary(file: File, folder?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);

  const res = await fetch('/api/upload', { method: 'POST', body: formData });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  return data.url as string;
}
