import path from 'node:path';
import type { BrowserContext } from 'playwright';
import { launchPersistent } from '../browser.js';
import { ROOT, ensureDir, getChannel } from '../config.js';
import type { ContentFile, PublishRecord } from '../types.js';

/**
 * 네이버 블로그는 글쓰기 오픈API가 종료되어 공식 발행 경로가 없다.
 * 따라서 브라우저 자동화로 처리하되, 두 가지를 원칙으로 둔다.
 *   1) 로컬(집 IP)에서만 실행한다 — 데이터센터 IP 는 차단 위험이 크다.
 *   2) 기본 동작은 "임시저장"이다. 최종 발행 버튼은 사람이 누른다.
 * 에디터 DOM 이 바뀌면 아래 SELECTORS 만 고치면 된다.
 */
const SELECTORS = {
  editorFrame: 'iframe#mainFrame',
  titleBox: '.se-section-documentTitle .se-text-paragraph',
  bodyBox: '.se-section-text .se-text-paragraph',
  saveDraftButton: 'button.save_btn__bzc5B, button:has-text("저장")',
  publishPanelButton: 'button.publish_btn__m9KHH, button:has-text("발행")',
  helpClose: 'button.se-help-panel-close-button',
} as const;

const PROFILE_DIR = path.join(ROOT, '.naver-profile');

export function assertLocal(): void {
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    throw new Error(
      '네이버 자동화는 CI 에서 실행할 수 없습니다 (채널 설정 local_only: true). 로컬에서 실행하세요.',
    );
  }
}

async function openContext(headless: boolean): Promise<BrowserContext> {
  ensureDir(PROFILE_DIR);
  // 영속 프로필을 쓰면 로그인 세션이 유지되어 매번 로그인할 필요가 없다.
  return launchPersistent(PROFILE_DIR, {
    headless,
    viewport: { width: 1440, height: 960 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });
}

/** 최초 1회. 브라우저가 열리면 직접 로그인하고 터미널에서 Enter 를 누른다. */
export async function naverLogin(): Promise<void> {
  assertLocal();
  const ctx = await openContext(false);
  const page = await ctx.newPage();
  await page.goto('https://nid.naver.com/nidlogin.login');
  console.log('브라우저에서 네이버에 로그인한 뒤, 이 터미널에서 Enter 를 누르세요.');
  await new Promise<void>((resolve) => process.stdin.once('data', () => resolve()));
  await ctx.close();
  console.log(`로그인 세션을 저장했습니다: ${path.relative(ROOT, PROFILE_DIR)}`);
}

export interface NaverPublishOptions {
  /** draft = 임시저장(기본) / schedule = 예약발행 패널까지 열기 */
  mode?: 'draft' | 'schedule';
  headless?: boolean;
  /** true 면 저장 직전에 멈추고 브라우저를 열어 둔다 (셀렉터 점검용) */
  dryRun?: boolean;
}

export async function publishToNaver(
  file: ContentFile,
  opts: NaverPublishOptions = {},
): Promise<PublishRecord> {
  assertLocal();
  const cfg = getChannel(file.meta.channel);
  const blogId = cfg.targets?.naver_blog_id;
  if (!blogId || blogId === 'CHANGE_ME') {
    throw new Error('channels/naver.yaml 의 targets.naver_blog_id 를 실제 블로그 아이디로 바꾸세요.');
  }
  const mode = opts.mode ?? cfg.publish.mode ?? 'draft';

  const ctx = await openContext(opts.headless ?? false);
  try {
    const page = await ctx.newPage();
    await page.goto(`https://blog.naver.com/${blogId}?Redirect=Write&`, { waitUntil: 'load' });

    const frame = page.frameLocator(SELECTORS.editorFrame);
    // 에디터가 뜨면 도움말 패널이 겹치는 경우가 있어 먼저 닫는다.
    await frame.locator(SELECTORS.helpClose).click({ timeout: 5_000 }).catch(() => {});

    await frame.locator(SELECTORS.titleBox).first().click();
    await page.keyboard.type(file.meta.title, { delay: 12 });

    await frame.locator(SELECTORS.bodyBox).first().click();
    for (const line of toPlainText(file.body).split('\n')) {
      await page.keyboard.type(line, { delay: 6 });
      await page.keyboard.press('Enter');
    }

    if (opts.dryRun) {
      console.log('dry-run: 저장하지 않고 멈춥니다. 브라우저에서 확인 후 Enter 를 누르세요.');
      await new Promise<void>((resolve) => process.stdin.once('data', () => resolve()));
      return { platform: 'naver', at: new Date().toISOString(), error: 'dry-run (미저장)' };
    }

    if (mode === 'draft') {
      await frame.locator(SELECTORS.saveDraftButton).first().click();
      await page.waitForTimeout(2_000);
      return { platform: 'naver', at: new Date().toISOString(), id: `draft:${file.meta.id}` };
    }

    // 예약발행은 발행 패널에서 날짜/시간을 지정해야 하고 UI 변동이 잦다.
    // 패널만 열어두고 사람이 마무리하도록 한다.
    await frame.locator(SELECTORS.publishPanelButton).first().click();
    console.log('발행 패널을 열었습니다. 예약 시각을 확인하고 직접 발행하세요. 끝나면 Enter.');
    await new Promise<void>((resolve) => process.stdin.once('data', () => resolve()));
    return { platform: 'naver', at: new Date().toISOString(), id: `manual:${file.meta.id}` };
  } finally {
    await ctx.close();
  }
}

/** 마크다운 마커를 네이버 에디터에 그대로 치기 좋은 평문으로 바꾼다. */
function toPlainText(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[PHOTO:(\d+)\]/g, '[사진 $1 — 여기에 직접 삽입]')
    .trim();
}
