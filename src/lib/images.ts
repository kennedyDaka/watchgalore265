export function imgUrl(url: string, width: number): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/w_${width},q_80,f_auto/`);
}
