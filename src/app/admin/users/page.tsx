import { requireAdmin } from '@/lib/auth/dal';
import { listUsers } from '@/lib/db/queries';
import { getLocaleAndDictionary } from '@/lib/i18n/server';
import { Badge, Card, SectionTitle } from '@/components/ui';
import { deleteUserAction, setUserRoleAction } from '../actions';

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const { dict } = await getLocaleAndDictionary();
  const users = listUsers();
  const adminCount = users.filter((user) => user.role === 'ADMIN').length;
  const t = dict.admin.usersPage;

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle title={t.title} description={t.summary(users.length, adminCount)} />

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="border-b border-line text-start text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t.colName}</th>
              <th className="px-4 py-3 text-start">{t.colEmail}</th>
              <th className="px-4 py-3 text-start">{t.colRole}</th>
              <th className="px-4 py-3 text-start">{t.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === admin.id;
              const isLastAdmin = user.role === 'ADMIN' && adminCount <= 1;
              const locked = isSelf || isLastAdmin;
              return (
                <tr key={user.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">
                    {user.name}
                    {isSelf ? <span className="text-xs text-muted"> ({t.you})</span> : null}
                  </td>
                  <td dir="ltr" className="force-ltr px-4 py-3 text-muted">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={user.role === 'ADMIN' ? 'warning' : 'neutral'}>
                      {user.role === 'ADMIN' ? t.admin : t.student}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={setUserRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          disabled={locked}
                          className="rounded-lg border border-line surface px-2 py-1.5 text-xs disabled:opacity-50"
                        >
                          <option value="STUDENT">{t.student}</option>
                          <option value="ADMIN">{t.admin}</option>
                        </select>
                        <button
                          type="submit"
                          disabled={locked}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold transition hover:border-brand-400 disabled:opacity-50"
                        >
                          {t.update}
                        </button>
                      </form>
                      <form action={deleteUserAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button
                          type="submit"
                          disabled={locked}
                          className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-950/40"
                        >
                          {t.delete}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted">{t.protection}</p>
    </div>
  );
}
