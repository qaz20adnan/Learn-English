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
    const users = await listUsers();
    const admins = users.filter((user) => user.role === 'ADMIN');
    const target = users.find((user) => user.id === parsed.data.userId);
    if (target?.role === 'ADMIN' && admins.length <= 1) {
      return; // never remove the last administrator
    }
  }

  await updateUserRole(parsed.data.userId, parsed.data.role);
  await logAudit({
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

  const users = await listUsers();
  const target = users.find((user) => user.id === userId);
  if (target?.role === 'ADMIN' && users.filter((u) => u.role === 'ADMIN').length <= 1) {
    return;
  }

  await deleteUser(userId);
  await logAudit({ actorId: admin.id, action: 'delete-user', entity: 'user', entityId: userId });
  revalidatePath('/admin/users');
}

export async function verifyMediaAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = mediaVerifySchema.safeParse({ mediaId: formData.get('mediaId') });
  if (!parsed.success) return;

  const media = await getMediaById(parsed.data.mediaId);
  if (!media) return;

  const result = await verifyMediaUrl(media.provider, media.externalId, media.url);
  await updateMediaVerification(media.id, result.status, result.note);
  await logAudit({
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
  const mediaList = await listMedia();
  for (const media of mediaList) {
    const result = await verifyMediaUrl(media.provider, media.externalId, media.url);
    await updateMediaVerification(media.id, result.status, result.note);
  }
  await logAudit({ actorId: admin.id, action: 'verify-all-media', entity: 'media' });
  revalidatePath('/admin/media');
}
