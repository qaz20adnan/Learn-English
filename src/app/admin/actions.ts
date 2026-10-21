'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/dal';
import { mediaVerifySchema, roleSchema } from '@/lib/validation';
import { verifyMediaUrl } from '@/lib/media';
import {
  deleteUser,
  getMediaById,
  listMedia,
  listUsers,
  logAudit,
  updateMediaVerification,
  updateUserRole,
} from '@/lib/db/queries';

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = roleSchema.safeParse({
    userId: formData.get('userId'),
    role: formData.get('role'),
  });
  if (!parsed.success) return;

  if (parsed.data.userId === admin.id) {
    // Prevent admins from accidentally locking themselves out.
    return;
  }

  if (parsed.data.role === 'STUDENT') {
    const admins = listUsers().filter((user) => user.role === 'ADMIN');
    const target = listUsers().find((user) => user.id === parsed.data.userId);
    if (target?.role === 'ADMIN' && admins.length <= 1) {
      return; // never remove the last administrator
    }
  }

  updateUserRole(parsed.data.userId, parsed.data.role);
  logAudit({
    actorId: admin.id,
    action: 'set-role',
    entity: 'user',
    entityId: parsed.data.userId,
    detail: parsed.data.role,
  });
  revalidatePath('/admin/users');
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  if (!userId || userId === admin.id) return;

  const target = listUsers().find((user) => user.id === userId);
  if (target?.role === 'ADMIN' && listUsers().filter((u) => u.role === 'ADMIN').length <= 1) {
    return;
  }

  deleteUser(userId);
  logAudit({ actorId: admin.id, action: 'delete-user', entity: 'user', entityId: userId });
  revalidatePath('/admin/users');
}

export async function verifyMediaAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = mediaVerifySchema.safeParse({ mediaId: formData.get('mediaId') });
  if (!parsed.success) return;

  const media = getMediaById(parsed.data.mediaId);
  if (!media) return;

  const result = await verifyMediaUrl(media.provider, media.externalId, media.url);
  updateMediaVerification(media.id, result.status, result.note);
  logAudit({
    actorId: admin.id,
    action: 'verify-media',
    entity: 'media',
    entityId: media.id,
    detail: result.status,
  });
  revalidatePath('/admin/media');
}

export async function verifyAllMediaAction(): Promise<void> {
  const admin = await requireAdmin();
  for (const media of listMedia()) {
    const result = await verifyMediaUrl(media.provider, media.externalId, media.url);
    updateMediaVerification(media.id, result.status, result.note);
  }
  logAudit({ actorId: admin.id, action: 'verify-all-media', entity: 'media' });
  revalidatePath('/admin/media');
}
