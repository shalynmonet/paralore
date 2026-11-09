import { spawnSync } from 'node:child_process';
const env = { ...process.env, NITRO_PRESET: 'vercel', AGENT_NATIVE_VERCEL_CRON_SCHEDULE: '0 9 * * *' };
if (env.VERCEL_ENV === 'production') {
  const migrate = spawnSync('pnpm', ['migrate:production'], { env, stdio: 'inherit', shell: process.platform === 'win32' });
  if (migrate.status !== 0) process.exit(migrate.status ?? 1);
}
const result = spawnSync(process.execPath, ['node_modules/@agent-native/core/bin/agent-native.js', 'build'], { env, stdio: 'inherit' });
process.exit(result.status ?? 1);
