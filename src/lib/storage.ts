import { supabase } from '@/lib/supabase';

const BUCKET_COMPANY_LOGOS = 'company-logos';
const BUCKET_TASK_FILES = 'task-files';

/** Sanitize filename for storage path: keep extension, safe chars only */
function sanitizeFileName(name: string): string {
  const base = name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
  return base.slice(0, 80) || 'file';
}

/**
 * Upload a company logo to Storage. Returns the public URL.
 * Path: {userId}/logo_{timestamp}_{filename}
 */
export async function uploadCompanyLogo(
  userId: string,
  file: File,
  _companyId?: string
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, '')) || 'logo';
  const path = `${userId}/logo_${Date.now()}_${safeName}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET_COMPANY_LOGOS).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_COMPANY_LOGOS).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a task document/file to Storage. Returns the public URL.
 * Path: {userId}/{taskIdOrPrefix}_{timestamp}_{filename}
 */
export async function uploadTaskFile(
  userId: string,
  file: File,
  taskId?: string
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const safeName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, '')) || 'doc';
  const prefix = taskId ? `${taskId}_` : '';
  const path = `${userId}/${prefix}${Date.now()}_${safeName}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET_TASK_FILES).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_TASK_FILES).getPublicUrl(path);
  return data.publicUrl;
}
