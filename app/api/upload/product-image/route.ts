import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { uploadProductImageForUser } from '@/lib/product-image-storage'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Please log in to upload images' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'No image selected' }, { status: 400 })
    }

    const { publicUrl } = await uploadProductImageForUser(user.id, file)
    return NextResponse.json({ success: true, publicUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image'
    console.error('Product image upload failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
