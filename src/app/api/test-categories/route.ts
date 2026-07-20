import { NextResponse } from 'next/server';
import { getCategoriesWithProducts, getCategories } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getCategoriesWithProducts();
    const allCats = await getCategories();
    return NextResponse.json({
      count: categories.length,
      names: categories.map((c: { name: string }) => c.name),
      allCount: allCats.length,
      allNames: allCats.map((c: { name: string }) => c.name),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
