#!/usr/bin/env -S npx tsx
import { parseArgs } from 'node:util';
import path from 'node:path';
import { ROOT, defaultFormat, getChannel, loadChannels } from './config.js';
import { explainError } from './claude.js';
import { refillBank } from './ideas.js';
import { createDraft } from './draft.js';
import { renderContent, renderAll } from './render.js';
import { publishDue, publishOne } from './publish/index.js';
import { naverLogin, publishToNaver } from './publish/naver.js';
import { collectInsights } from './insights.js';
import { channelStatus, weeklyReport } from './report.js';
import { listContent, loadIdeas, readContent, updateMeta } from './store.js';

const USAGE = `
사용법: npm run pipe -- <명령> [옵션]

  status                          전체 채널 현황
  ideas    --channel <id> [-n 6]  소재 뱅크 채우기 (auto 트랙은 웹 리서치 사용)
  ideas:list [--channel <id>]     뱅크에 쌓인 소재 보기
  draft    --channel <id>         초안 생성 [--idea <id>] [--notes <파일>] [--format <f>] [--at <ISO>]
                                  네이버 롱폼은 --notes 로 여행 메모를 넣는다
  render   [--id <id>]            초안 슬라이드를 PNG 로 렌더 (없으면 draft 전체)
  approve  --id <id>              초안을 발행 대기 상태로 전환
  publish  [--channel <id>]       발행 시각이 지난 건을 올린다 [--dry] [--include-drafts]
  publish:one --id <id>           한 건을 즉시 올린다
  naver:login                     네이버 로그인 세션 1회 저장 (로컬 전용)
  naver:draft --id <id>           네이버 블로그 임시저장 [--dry]
  insights [--channel <id>]       성과 수집
  report   [--days 7]             주간 리포트 마크다운 출력

채널: ${[...loadChannels().keys()].join(', ')}
`.trim();

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      channel: { type: 'string', short: 'c' },
      count: { type: 'string', short: 'n' },
      idea: { type: 'string' },
      format: { type: 'string', short: 'f' },
      at: { type: 'string' },
      notes: { type: 'string' },
      id: { type: 'string' },
      days: { type: 'string' },
      dry: { type: 'boolean', default: false },
      'include-drafts': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  const cmd = positionals[0];
  if (!cmd || values.help) {
    console.log(USAGE);
    return;
  }

  switch (cmd) {
    case 'status': {
      console.log(channelStatus());
      break;
    }

    case 'ideas': {
      const channel = required(values.channel, '--channel');
      const count = Number(values.count ?? 6);
      const { added, skipped } = await refillBank(channel, count);
      console.log(`소재 ${added.length}건 추가 (중복 ${skipped.length}건 제외)`);
      for (const i of added) console.log(`  ${i.id}  ${i.title}\n    ↳ ${i.angle}`);
      break;
    }

    case 'ideas:list': {
      const all = loadIdeas().filter((i) => !values.channel || i.channel === values.channel);
      if (!all.length) return console.log('소재 뱅크가 비어 있습니다.');
      for (const i of all) {
        const season = loadChannels().get(i.channel)?.season;
        // 시즌이 걸린 채널에서 시즌 밖 소재는 자동 선택되지 않는다.
        const offSeason = Boolean(season && i.theme !== season.id);
        const mark = i.usedBy ? '✔' : offSeason ? '⏸' : '·';
        console.log(`${mark} ${i.id}  [${i.channel}] ${i.title}${offSeason ? '  — 시즌 밖(보류)' : ''}`);
        if (!i.usedBy && !offSeason) console.log(`    ↳ ${i.angle}  (근거 ${i.facts.length}건)`);
      }
      if (values.channel) {
        const season = loadChannels().get(values.channel as never)?.season;
        if (season) console.log(`\n현재 시즌: ${season.name}  (⏸ 는 --idea 로 직접 지정해야 씁니다)`);
      }
      break;
    }

    case 'draft': {
      const channel = required(values.channel, '--channel');
      const cfg = getChannel(channel);
      const out = await createDraft({
        channel,
        ...(values.idea ? { ideaId: values.idea } : {}),
        ...(values.notes ? { notesPath: values.notes } : {}),
        format: values.format ?? defaultFormat(cfg),
        ...(values.at ? { publishAt: values.at } : {}),
      });
      console.log(`초안 생성: ${path.relative(ROOT, out.path)}`);
      console.log(`  제목: ${out.meta.title}`);
      console.log(`  발행예정: ${out.meta.publishAt ?? '(미정)'}`);
      if (out.meta.slides?.length) console.log(`  다음: npm run pipe -- render --id ${out.meta.id}`);
      break;
    }

    case 'render': {
      if (values.id) {
        const file = findById(values.id);
        const images = await renderContent(file.path);
        console.log(`${images.length}장 렌더:\n${images.map((i) => `  ${i}`).join('\n')}`);
      } else {
        const targets = listContent({ status: 'draft' }).filter((f) => f.meta.slides?.length);
        const result = await renderAll(targets);
        console.log(`${result.size}건 렌더 완료`);
      }
      break;
    }

    case 'approve': {
      const file = findById(required(values.id, '--id'));
      if (file.meta.slides?.length && !file.meta.images?.length) {
        throw new Error(`${file.meta.id}: 아직 렌더되지 않았습니다. 먼저 render 를 실행하세요.`);
      }
      updateMeta(file, { status: 'approved' });
      console.log(`승인: ${file.meta.id} → ${file.meta.publishAt ?? '(발행시각 미정)'}`);
      break;
    }

    case 'publish': {
      const results = await publishDue({
        ...(values.channel ? { channel: values.channel } : {}),
        dryRun: values.dry,
        includeDrafts: values['include-drafts'],
      });
      if (!results.length) console.log('발행할 콘텐츠가 없습니다.');
      if (results.some((r) => !r.ok)) process.exitCode = 1;
      break;
    }

    case 'publish:one': {
      const file = findById(required(values.id, '--id'));
      const result = await publishOne(file.path);
      if (!result.ok) process.exitCode = 1;
      break;
    }

    case 'naver:login': {
      await naverLogin();
      break;
    }

    case 'naver:draft': {
      const file = findById(required(values.id, '--id'));
      const rec = await publishToNaver(file, { mode: 'draft', dryRun: values.dry });
      console.log(rec.error ? `중단: ${rec.error}` : `임시저장 완료: ${file.meta.title}`);
      break;
    }

    case 'insights': {
      await collectInsights(values.channel ? { channel: values.channel } : {});
      break;
    }

    case 'report': {
      console.log(weeklyReport({ days: Number(values.days ?? 7) }));
      break;
    }

    default:
      console.error(`알 수 없는 명령: ${cmd}\n\n${USAGE}`);
      process.exitCode = 1;
  }
}

function required(value: string | undefined, flag: string): string {
  if (!value) throw new Error(`${flag} 가 필요합니다.`);
  return value;
}

function findById(id: string) {
  const match = listContent().find((f) => f.meta.id === id);
  if (!match) throw new Error(`콘텐츠 "${id}" 를 찾을 수 없습니다.`);
  return readContent(match.path);
}

main().catch((err) => {
  console.error(`\n오류: ${explainError(err)}`);
  process.exitCode = 1;
});
