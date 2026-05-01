import { writeFile } from 'fs/promises'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'

export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (process.env.CLOUDINARY_URL) {
    return uploadToCloudinary(buffer, file.name)
  }
  return saveLocally(buffer, file.name)
}

async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: 'rental-website', public_id: filename.replace(/\.[^/.]+$/, '') },
        (error, result) => {
          if (error || !result) reject(error || new Error('Upload failed'))
          else resolve(result.secure_url)
        }
      )
      .end(buffer)
  })
}

async function saveLocally(buffer: Buffer, filename: string): Promise<string> {
  const uniqueName = `${Date.now()}-${filename.replace(/\s+/g, '-')}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await writeFile(path.join(uploadDir, uniqueName), buffer)
  return `/uploads/${uniqueName}`
}
