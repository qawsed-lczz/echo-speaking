import { spawn } from 'node:child_process';

/**
 * Build the Android APK on EAS without requiring a local Git repository.
 * EAS uses EAS_NO_VCS to archive the project according to .gitignore.
 */
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(
  npx,
  ['eas-cli@latest', 'build', '--platform', 'android', '--profile', 'preview'],
  {
    stdio: 'inherit',
    env: { ...process.env, EAS_NO_VCS: '1' },
    shell: process.platform === 'win32',
  }
);

child.on('error', (error) => {
  console.error('无法启动 eas-cli:', error.message);
  process.exit(1);
});

child.on('exit', (code) => process.exit(code ?? 1));
