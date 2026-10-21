import { createHash, randomBytes } from 'node:crypto';
import { newId, nowIso, run } from '../src/lib/db/client';
import { hashPassword } from '../src/lib/auth/password';
import { countUsers, createUser, ensureSettings } from '../src/lib/db/queries';

const email = 'smoke@example.com';

async function main(): Promise<void> {
  await run('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)', email);
  await run('DELETE FROM user_settings WHERE user_id IN (SELECT id FROM users WHERE email = ?)', email);
  await run('DELETE FROM users WHERE email = ?', email);

  const passwordHash = await hashPassword('Smoke!2345');
  const user = await createUser({
    email,
    name: 'Smoke Tester',
    passwordHash,
    role: (await countUsers()) === 0 ? 'ADMIN' : 'STUDENT',
  });
  await ensureSettings(user.id);

  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await run(
    `INSERT INTO sessions (id, user_id, token_hash, user_agent, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    newId('ses'),
    user.id,
    tokenHash,
    'smoke',
    new Date(Date.now() + 30 * 864e5).toISOString(),
    nowIso(),
  );

  console.log(token);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
