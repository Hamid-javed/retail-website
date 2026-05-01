import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/apiAuth'
import { uploadImage } from '@/lib/upload'

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const url = await uploadImage(file)
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
