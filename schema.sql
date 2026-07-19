-- =========================================================
--  コタツ Playlist — Supabase 스키마
--  Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 RUN 하세요.
--  (여러 번 실행해도 안전하도록 작성됨)
-- =========================================================

-- ---------- 1. songs : 곡 카드 ----------
create table if not exists public.songs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  position        integer not null default 0,        -- 정렬 순서 (작을수록 위)
  youtube_id      text,                               -- 유튜브 영상 ID (예: cBxQ6bmy_9I)
  album_cover_url text,                               -- 앨범 커버 이미지 URL
  title           text not null,
  artist          text,
  lyrics          text,                               -- 가사 (원문/번역 한 덩어리, 줄바꿈 그대로 표시)
  quote           text,                               -- 강조 인용구
  trivia          text,                               -- 하단 코멘트
  bubbles         jsonb not null default '[]'::jsonb, -- [{ "side":"left"|"right", "text":"..." }]
  accent_color    text,                               -- 이 카드 전용 강조색(말풍선 글자색). 비우면 전역색
  bg_image_url    text                                -- 카드 배경 override. 비우면 앨범 커버 사용
);

-- ---------- 2. guestbook : 방명록 ----------
create table if not exists public.guestbook (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null,
  message    text not null
);

-- ---------- 3. settings : 사이트 전역 설정 (단일 행, id=1) ----------
create table if not exists public.settings (
  id            integer primary key default 1,
  site_title    text default 'コタツ',
  site_subtitle text default '',
  bg_image_url  text default '',     -- 전역 배경 이미지
  accent_color  text default '#7eb27b',
  custom_css    text default '',     -- 관리자용 자유 커스텀 CSS (선택)
  youtube_playlist_id text default '', -- 상단 플레이어 바가 자동재생할 유튜브 재생목록 ID
  -- 디자인 커스터마이징 (전부 선택 항목 — 비워두면 기존 기본값을 그대로 사용)
  bg_color           text default '',  -- 페이지 배경색
  panel_color        text default '',  -- 카드/패널 기본 배경색
  text_color         text default '',  -- 기본 글자색
  bubble_left_bg     text default '',  -- 왼쪽 말풍선 배경색
  bubble_left_text   text default '',  -- 왼쪽 말풍선 글자색
  bubble_right_bg    text default '',  -- 오른쪽 말풍선 배경색
  bubble_right_text  text default '',  -- 오른쪽 말풍선 글자색
  constraint settings_single_row check (id = 1)
);

-- 기존에 settings 테이블이 이미 있던 경우를 위한 컬럼 추가 (있으면 건너뜀)
alter table public.settings add column if not exists youtube_playlist_id text default '';
alter table public.settings add column if not exists bg_color           text default '';
alter table public.settings add column if not exists panel_color        text default '';
alter table public.settings add column if not exists text_color         text default '';
alter table public.settings add column if not exists bubble_left_bg     text default '';
alter table public.settings add column if not exists bubble_left_text   text default '';
alter table public.settings add column if not exists bubble_right_bg    text default '';
alter table public.settings add column if not exists bubble_right_text  text default '';

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- =========================================================
--  RLS (Row Level Security)
--  핵심: 누구나 읽기 가능 / 쓰기는 로그인한 관리자만.
--  방명록만 "쓰기"도 누구나 허용(방문자가 글 남길 수 있게).
-- =========================================================
alter table public.songs     enable row level security;
alter table public.guestbook enable row level security;
alter table public.settings  enable row level security;

-- songs ----------------------------------------------------
drop policy if exists "songs read"  on public.songs;
drop policy if exists "songs write" on public.songs;
create policy "songs read"  on public.songs for select to anon, authenticated using (true);
create policy "songs write" on public.songs for all    to authenticated using (true) with check (true);

-- guestbook ------------------------------------------------
drop policy if exists "gb read"   on public.guestbook;
drop policy if exists "gb insert" on public.guestbook;
drop policy if exists "gb delete" on public.guestbook;
create policy "gb read"   on public.guestbook for select to anon, authenticated using (true);
create policy "gb insert" on public.guestbook for insert to anon, authenticated with check (
  char_length(name) between 1 and 40 and char_length(message) between 1 and 500
);
create policy "gb delete" on public.guestbook for delete to authenticated using (true);

-- settings -------------------------------------------------
drop policy if exists "settings read"  on public.settings;
drop policy if exists "settings write" on public.settings;
create policy "settings read"  on public.settings for select to anon, authenticated using (true);
create policy "settings write" on public.settings for update to authenticated using (true) with check (true);

-- =========================================================
--  (선택) 실시간 방명록을 쓰려면 아래 한 줄을 실행하세요.
--  안 해도 방명록은 정상 동작합니다(열거나 글 남기면 새로고침).
-- =========================================================
-- alter publication supabase_realtime add table public.guestbook;

-- =========================================================
--  샘플 곡 1개 (원본 데이터). 필요 없으면 이 블록은 지워도 됩니다.
-- =========================================================
insert into public.songs (position, youtube_id, album_cover_url, title, artist, lyrics, quote, trivia, bubbles)
values (
  1,
  'cBxQ6bmy_9I',
  'https://lineimg.omusic.com.tw/img/album/2598595.jpg?v=20241011123012',
  '人間みたいね',
  'キタニタツヤ',
  $$あなたの優しさは涸れてしまって
너의 상냥함은 메말라 버려서
同じ生き物じゃなくなったみたいだ
같은 생명체라고는 믿을 수 없게 됐어
それでも誰かの代わりで良かったのに
그래도 누군가의 대체품이 될 수 있을 것 같아서 좋았는데
どうやらそれも叶わない
아무래도 그것도 이루어지지 않을 것 같네
悲しみの形がわかっていった
슬픔의 형태가 어떤 건지 알았어
あなたに見合うのはもっと奥の暗く深い地獄だよ
너한테 어울리는건 좀 더 깊고 어두운 지옥이야
壊れたら元には戻らないこと
무너져 버리면 전처럼 돌아올 수 없다는 거
わかっているでしょう?
알고 있지?
あなたまるで人間みたいね
너 말이야, 꼭 인간 같네
けだもののくせにさ
짐승 주제에 말이야
脳の奥がさ冷えてくのがわかるんだ
뇌 속이 차갑게 식어가는 게 느껴지는 기분이야
わたしと同じように誰かを
나처럼 누군가를
愛せた気になっても
사랑할 수 있을 것 같다고 해도
それじゃ駄目だよ
그래서는 안 돼
お揃いの悪夢の中で会える日を待ってるから
너와 내가 악몽 속에서 만날 날을 기다리고 있으니까$$,
  '犬の骨のようにあなたの玩具で終わってしまった',
  '원래도 좋아하는 노래인데 참 타이시 같죠⋯⋯⋯.',
  $$[
    {"side":"left","text":"*그는 당신의 멱살을 잡고 욕조 벽으로 거칠게 밀어붙였다.* \"말해. 뭐가 웃기냐고.\""},
    {"side":"right","text":"\"하하⋯⋯.\" *몰라. 몰라. 몰라!* \"⋯⋯장난감 취급하는 건 너잖아⋯⋯.\""}
  ]$$::jsonb
)
on conflict do nothing;
