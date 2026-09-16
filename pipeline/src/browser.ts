import fs from 'node:fs';
import { chromium, type Browser, type BrowserContext, type LaunchOptions } from 'playwright';

/**
 * 크로미움 실행 파일 경로.
 * 기본은 playwright 가 설치한 브라우저를 쓰고, CHROMIUM_PATH 가 있으면 그것을 쓴다.
 * (CI 이미지에 미리 깔린 크로미움 버전이 playwright 기대치와 다를 때 필요하다.)
 */
export function executablePath(): string | undefined {
  const explicit = process.env.CHROMIUM_PATH;
  if (explicit && fs.existsSync(explicit)) return explicit;
  const preinstalled = '/opt/pw-browsers/chromium';
  if (!explicit && fs.existsSync(preinstalled)) return preinstalled;
  return undefined;
}

function withExecutable<T extends LaunchOptions>(opts: T): T {
  const exe = executablePath();
  return exe ? { ...opts, executablePath: exe } : opts;
}

export function launch(opts: LaunchOptions = {}): Promise<Browser> {
  return chromium.launch(withExecutable(opts));
}

export function launchPersistent(
  userDataDir: string,
  opts: Parameters<typeof chromium.launchPersistentContext>[1] = {},
): Promise<BrowserContext> {
  return chromium.launchPersistentContext(userDataDir, withExecutable(opts ?? {}));
}
