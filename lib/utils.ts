import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Save a file to the uploads directory and return the URL
 * @param file The file to save
 * @returns The URL of the saved file
 */
export async function saveFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Generate a unique filename
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const filePath = path.join(uploadsDir, fileName);
  
  // Write the file to disk
  fs.writeFileSync(filePath, buffer);
  
  // Return the URL path
  return `/uploads/${fileName}`;
}

/**
 * Delete a file from the uploads directory
 * @param url The URL of the file to delete
 */
export function deleteFile(url: string): void {
  if (!url.startsWith('/uploads/')) {
    return;
  }
  
  const fileName = url.split('/').pop();
  if (!fileName) {
    return;
  }
  
  const filePath = path.join(uploadsDir, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
} 