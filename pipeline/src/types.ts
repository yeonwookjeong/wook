/** 채널 식별자. channels/<id>.yaml 파일명과 일치해야 한다. */
export type ChannelId =
  | 'toryvel'
  | 'halgeo'
  | 'naver'
  | 'manta'
  | 'woogi'
  | 'jp-threads';

/**
 * auto   = 소재→초안→이미지→발행까지 파이프라인이 끝낸다 (리서치 기반 채널)
 * assist = 소재·기획·초안까지만. 실제 촬영본이 필요하므로 최종 제작은 사람이 한다
 */
export type Track = 'auto' | 'assist';

export type ContentStatus =
  | 'idea'       // 소재 뱅크에만 있음
  | 'draft'      // 초안 생성됨. 사람 검토 대기 (= PR)
  | 'approved'   // 검토 통과. 발행 시각 대기
  | 'scheduled'  // 플랫폼에 예약 걸림
  | 'published'
  | 'failed';

export interface FormatSpec {
  id: string;
  name?: string;
  default?: boolean;
  note?: string;
  ratio?: string;
  slides?: { min: number; max: number };
  duration_sec?: { min: number; max: number };
  length?: { min_chars: number; max_chars: number };
  structure?: Array<{ role: string; count: number; note?: string }>;
}

export interface ChannelConfig {
  id: ChannelId;
  name: string;
  track: Track;
  language: 'ko' | 'en' | 'ja';
  automation?: 'none';
  owner?: string;
  bio?: string;
  positioning?: string;
  targets?: {
    instagram?: string;
    threads?: string;
    youtube?: string;
    naver_blog_id?: string;
  };
  formats: FormatSpec[];
  series?: Array<{ id: string; name: string; note?: string }>;
  tone: {
    voice: string;
    banned_phrases?: string[];
    rules?: string[];
  };
  research?: { enabled: boolean; query_hints?: string[] };
  geo?: { export: boolean; default_city?: string };
  seo?: { keyword_slots: number; meta_tags_max: number };
  theme?: { bg: string; fg: string; accent: string; font: string };
  hashtags?: string[];
  highlights?: string[];
  source_hints?: string[];
  performance_baseline?: Record<string, unknown>;
  publish: {
    mode?: 'draft' | 'schedule';
    local_only?: boolean;
    slots: string[];
    timezone: string;
  };
}

/** 소재 뱅크 한 건. 아직 글이 되지 않은 상태. */
export interface Idea {
  id: string;
  channel: ChannelId;
  title: string;
  /** 왜 이게 이 채널에 맞는지 — 한 줄 */
  angle: string;
  /** 검증이 필요한 사실들. 초안 생성 시 이 목록을 근거로 쓴다. */
  facts: Array<{ claim: string; source?: string; confidence: 'high' | 'medium' | 'low' }>;
  /** 할거없나 지도 연동용 (있을 때만) */
  place?: { name: string; district?: string; lat?: number; lng?: number };
  /** 일본 관련 소재면 true — 일본어 스레드 교차 공유 후보 */
  japan_related?: boolean;
  createdAt: string;
  usedBy?: string; // 이 소재로 만들어진 콘텐츠 id
}

export interface Slide {
  role: string;
  heading: string;
  body: string;
  keyword?: string;
}

export interface PublishRecord {
  platform: 'instagram' | 'threads' | 'youtube' | 'naver';
  id?: string;
  permalink?: string;
  at: string;
  error?: string;
}

/** content/<channel>/<file>.md 의 frontmatter */
export interface ContentMeta {
  id: string;
  channel: ChannelId;
  track: Track;
  status: ContentStatus;
  format: string;
  title: string;
  /** ISO8601 with offset. 이 시각이 지나면 publish 워크플로가 집어간다. */
  publishAt?: string;
  slides?: Slide[];
  /** 렌더된 이미지 경로 (repo 상대). render 단계가 채운다. */
  images?: string[];
  /** 사람이 넣어야 하는 에셋. assist 트랙에서 사용 */
  assets?: string[];
  hashtags?: string[];
  ideaId?: string;
  place?: Idea['place'];
  published?: PublishRecord[];
  createdAt: string;
}

export interface ContentFile {
  path: string;
  meta: ContentMeta;
  /** 캡션 본문 (또는 네이버 롱폼 전체) */
  body: string;
}

export interface InsightRow {
  date: string;
  channel: ChannelId;
  platform: PublishRecord['platform'];
  mediaId: string;
  contentId?: string;
  format?: string;
  views?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  saved?: number;
  shares?: number;
  followers?: number;
}
