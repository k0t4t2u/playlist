/* =========================================================
   コタツ Playlist — viewer (app.js)
   - Supabase에서 settings / songs / guestbook 로드
   - 상단 슬림 플레이어 바 (유튜브 재생목록 또는 곡 목록 자동 큐)
   - 카드 렌더링 / 접기(localStorage 기억) / 검색 / 현재 곡 하이라이트
   - 유리 재질 방명록 모달, 재생목록 패널, 키보드 단축키
   ========================================================= */
(() => {
  "use strict";

  const CFG = window.KOTATSU_CONFIG || {};
  const isConfigured =
    CFG.SUPABASE_URL &&
    CFG.SUPABASE_ANON_KEY &&
    !CFG.SUPABASE_URL.includes("여기에") &&
    !CFG.SUPABASE_ANON_KEY.includes("여기에");

  // ----- 아이콘 (Feather, MIT) -----
  const ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
    pause:
      '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>',
    shuffle:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
    repeat:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    video:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>',
    chevron:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    volume:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    music:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  };

  // ----- 전역 상태 -----
  let sb = null;
  let songs = [];
  let settings = {};
  const LS = {
    collapsed: "kotatsu.collapsed",
    vol: "kotatsu.volume",
    muted: "kotatsu.muted",
    gbSeen: "kotatsu.gbSeen",
  };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  // ===== 부팅 =====
  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    wireChrome();
    Player.mount();

    if (!isConfigured) {
      $("#setupBanner").hidden = false;
      renderEmpty(
        "Supabase 설정이 필요합니다.\nconfig.js에 URL과 anon 키를 넣어주세요.",
      );
      Player.setQueue([], "");
      return;
    }
    if (!window.supabase) {
      renderEmpty(
        "Supabase 라이브러리를 불러오지 못했습니다.\n네트워크를 확인해주세요.",
      );
      Player.setQueue([], "");
      return;
    }

    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

    await loadSettings();
    await loadSongs();
    renderSongs();
    Player.setQueue(songs, settings.youtube_playlist_id || "");
    setupGuestbookRealtime();
    prefetchGuestbookCount();
  }

  // ============================================================
  //  설정
  // ============================================================
  async function loadSettings() {
    const { data, error } = await sb
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      console.warn("settings load:", error.message);
      return;
    }
    settings = data || {};
    applySettings();
  }

  function applySettings() {
    const title = settings.site_title || "コタツ";
    document.title = title;
    setText("#siteTitle", title);
    const sub = settings.site_subtitle || "";
    const subEl = $("#siteSubtitle");
    if (subEl) {
      subEl.textContent = sub;
      subEl.classList.toggle("hidden", !sub);
    }

    const bg = settings.bg_image_url || "https://i.imgur.com/Z9ChDtn.png";
    document.body.style.setProperty("--site-bg", `url("${cssUrl(bg)}")`);

    if (settings.accent_color)
      document.documentElement.style.setProperty(
        "--accent",
        settings.accent_color,
      );
    // 전체 디자인 커스터마이징 (관리자 설정 > 디자인) — 비어 있으면 기존 기본값(패널/강조색 연동)을 그대로 따름
    const THEME_VARS = {
      bg_color: "--bg",
      panel_color: "--panel",
      text_color: "--text",
      bubble_left_bg: "--bubble-left-bg",
      bubble_left_text: "--bubble-left-text",
      bubble_right_bg: "--bubble-right-bg",
      bubble_right_text: "--bubble-right-text",
    };
    for (const key in THEME_VARS) {
      if (settings[key])
        document.documentElement.style.setProperty(
          THEME_VARS[key],
          settings[key],
        );
    }

    if (settings.custom_css) {
      let tag = $("#customCss");
      if (!tag) {
        tag = document.createElement("style");
        tag.id = "customCss";
        document.head.appendChild(tag);
      }
      tag.textContent = settings.custom_css;
    }
  }

  // ============================================================
  //  곡 로드 & 렌더
  // ============================================================
  async function loadSongs() {
    const { data, error } = await sb
      .from("songs")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      renderEmpty("곡을 불러오지 못했습니다: " + error.message);
      return;
    }
    songs = data || [];
  }

  function renderSongs() {
    const wrap = $("#playlist");
    wrap.innerHTML = "";
    if (!songs.length) {
      renderEmpty(
        "아직 등록된 곡이 없습니다.\n관리자 페이지에서 첫 곡을 추가해보세요.",
      );
      return;
    }
    const collapsed = getCollapsedSet();
    songs.forEach((song, i) =>
      wrap.appendChild(buildCard(song, i, collapsed.has(song.id))),
    );
  }

  function buildCard(song, index, isCollapsed) {
    const cover = song.album_cover_url || "";
    const bgImg = song.bg_image_url || cover;

    const entry = el("div", "song-entry");
    entry.dataset.id = song.id;
    entry.dataset.index = String(index);
    if (song.youtube_id) entry.dataset.vid = song.youtube_id;
    if (isCollapsed) entry.classList.add("collapsed");
    if (bgImg) entry.style.setProperty("--bg-image", `url("${cssUrl(bgImg)}")`);
    if (song.accent_color)
      entry.style.setProperty("--entry-accent", song.accent_color);

    // 재생 중 뱃지
    const tag = el("div", "now-tag");
    tag.innerHTML = "<i></i><i></i><i></i><span>재생 중</span>";
    entry.appendChild(tag);

    // 우상단 컨트롤 (접기/펼치기) — 재생 버튼은 앨범 커버 위 cover-play와 중복이라 제거
    const controls = el("div", "entry-controls");
    const collapseBtn = iconButton("collapse-btn", ICON.chevron, "접기/펼치기");
    collapseBtn.addEventListener("click", () => toggleCollapse(entry, song.id));
    controls.appendChild(collapseBtn);

    // 접힌 헤더
    const mini = el("div", "entry-mini");
    if (cover) {
      const mi = el("img");
      mi.src = cover;
      mi.alt = "";
      mi.loading = "lazy";
      mini.appendChild(mi);
    }
    const miniMeta = el("div");
    miniMeta.appendChild(
      textEl("div", "mini-title", song.title || "(제목 없음)"),
    );
    if (song.artist)
      miniMeta.appendChild(textEl("div", "mini-artist", song.artist));
    mini.appendChild(miniMeta);
    mini.addEventListener("click", (ev) => {
      if (!ev.target.closest("button")) toggleCollapse(entry, song.id);
    });

    // 펼친 본문 (entry-full은 접기/펼치기 애니메이션용 grid 컨테이너,
    // 실제 내용은 전부 inner 하나에 담아 높이를 한 번에 애니메이션한다)
    const full = el("div", "entry-full");
    const inner = el("div", "entry-full-inner");
    const body = el("div", "card-body");

    const left = el("div", "left-column");
    if (cover) {
      const albumCover = el("div", "album-cover");
      const img = el("img");
      img.src = cover;
      img.alt = `${song.title || ""} 앨범 커버`;
      img.loading = "lazy";
      albumCover.appendChild(img);
      if (song.youtube_id) {
        const cp = el("button", "cover-play");
        cp.type = "button";
        cp.setAttribute("aria-label", `${song.title || "이 곡"} 재생`);
        cp.innerHTML = `<span>${ICON.play}</span>`;
        cp.addEventListener("click", () => Player.playSong(song));
        albumCover.appendChild(cp);
      }
      left.appendChild(albumCover);
    }
    // 원본 디자인 요소 복원: 커버 밑, 곡 제목 위에 얇은 유튜브 스트립.
    // 상단 플레이어 바가 실제 재생을 전담하므로 여기는 순수 장식(클릭 불가, CSS에서 pointer-events:none).
    if (song.youtube_id) {
      const yp = el("div", "youtube-player");
      const ifr = el("iframe");
      ifr.src = `https://www.youtube.com/embed/${encodeURIComponent(song.youtube_id)}`;
      ifr.title = song.title || "YouTube";
      ifr.loading = "lazy";
      ifr.tabIndex = -1;
      yp.appendChild(ifr);
      left.appendChild(yp);
    }
    const titleBox = el("div", "song-title");
    titleBox.appendChild(textEl("h2", "title", song.title || "(제목 없음)"));
    if (song.artist) titleBox.appendChild(textEl("p", "artist", song.artist));
    left.appendChild(titleBox);

    const right = el("div", "right-column");
    right.appendChild(textEl("div", "lyrics", song.lyrics || ""));

    body.append(left, right);
    inner.appendChild(body);

    if (song.quote) inner.appendChild(textEl("div", "quote", song.quote));

    const bubbles = parseBubbles(song.bubbles);
    if (bubbles.length) {
      const bc = el("div", "bubble-container");
      bubbles.forEach((b) => {
        const side = b.side === "right" ? "bubble-right" : "bubble-left";

        // 1. 말풍선 요소 생성
        const bubbleEl = el("div", `bubble ${side}`);

        // 2. 텍스트 안의 *텍스트* 를 찾아 span 태그로 변환
        const originalText = b.text || "";
        const italicRegex = /\*([^*]+)\*/g;
        const processedText = originalText.replace(
          italicRegex,
          '<span class="italic-gray">$1</span>',
        );

        // 3. 변환된 HTML을 적용
        bubbleEl.innerHTML = processedText;
        bc.appendChild(bubbleEl);
      });
      inner.appendChild(bc);
    }

    if (song.trivia) inner.appendChild(textEl("div", "trivia", song.trivia));

    full.appendChild(inner);
    entry.append(controls, mini, full);
    return entry;
  }

  function parseBubbles(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  // ---------- 카드 접기 ----------
  function getCollapsedSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem(LS.collapsed) || "[]"));
    } catch {
      return new Set();
    }
  }
  function saveCollapsedSet(set) {
    try {
      localStorage.setItem(LS.collapsed, JSON.stringify([...set]));
    } catch {}
  }
  function toggleCollapse(entry, id) {
    const set = getCollapsedSet();
    const nowCollapsed = entry.classList.toggle("collapsed");
    if (nowCollapsed) set.add(id);
    else set.delete(id);
    saveCollapsedSet(set);
  }
  function setAllCollapsed(state) {
    const set = new Set();
    $$(".song-entry").forEach((entry) => {
      entry.classList.toggle("collapsed", state);
      if (state) set.add(entry.dataset.id);
    });
    saveCollapsedSet(set);
  }

  // ============================================================
  //  상단 플레이어 바
  //  1순위: settings.youtube_playlist_id (유튜브 재생목록)
  //  2순위: 등록된 곡들의 youtube_id 로 자동 큐 구성
  // ============================================================
  const Player = (() => {
    let yt = null,
      ready = false,
      apiRequested = false;
    let shuffle = false,
      repeat = "off"; // off | all | one
    let timer = null,
      dragging = false;
    let queueSongs = [],
      listId = "",
      videoIds = [];
    let pending = null; // API 준비 전 예약된 동작
    let currentVid = "";

    // ---------- 마운트 (데이터 없이도 바는 항상 보임) ----------
    function mount() {
      document.body.classList.add("has-bar"); // 상단 바 높이만큼 본문 밀어내기
      fillIcon("#pbShuffle", ICON.shuffle);
      fillIcon("#pbPrev", ICON.prev);
      fillIcon("#pbPlay", ICON.play);
      fillIcon("#pbNext", ICON.next);
      fillIcon("#pbRepeat", ICON.repeat + '<span class="rep-one">1</span>');
      fillIcon("#pbVideo", ICON.video);
      fillIcon("#pbMute", ICON.volume);
      fillIcon("#pbQueue", ICON.list);
      fillIcon("#pbGuest", ICON.book);
      fillIcon("#pbAdmin", ICON.gear);

      $("#pbPlay").addEventListener("click", playPause);
      $("#pbPrev").addEventListener("click", prev);
      $("#pbNext").addEventListener("click", next);

      $("#pbShuffle").addEventListener("click", () => {
        shuffle = !shuffle;
        $("#pbShuffle").classList.toggle("active", shuffle);
        safe(() => yt.setShuffle(shuffle));
        renderQueue();
      });

      $("#pbRepeat").addEventListener("click", () => {
        repeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
        const b = $("#pbRepeat");
        b.classList.toggle("active", repeat !== "off");
        b.classList.toggle("one", repeat === "one");
        safe(() => yt.setLoop(repeat === "all"));
        toast(
          repeat === "off"
            ? "반복 끄기"
            : repeat === "all"
              ? "전체 반복"
              : "한 곡 반복",
        );
      });

      $("#pbVideo").addEventListener("click", (e) => {
        const on = document.body.classList.toggle("show-video");
        e.currentTarget.classList.toggle("active", on);
      });

      $("#pbNow").addEventListener("click", scrollToCurrent);

      // 볼륨 / 음소거 (localStorage 기억)
      const vol = $("#pbVolume");
      vol.value = String(getNum(LS.vol, 80));
      let muted = localStorage.getItem(LS.muted) === "1";
      const paintVol = () => {
        fillIcon(
          "#pbMute",
          muted || Number(vol.value) === 0 ? ICON.mute : ICON.volume,
        );
      };
      paintVol();
      vol.addEventListener("input", () => {
        muted = false;
        try {
          localStorage.setItem(LS.vol, vol.value);
          localStorage.setItem(LS.muted, "0");
        } catch {}
        safe(() => {
          yt.unMute();
          yt.setVolume(Number(vol.value));
        });
        paintVol();
      });
      $("#pbMute").addEventListener("click", () => {
        muted = !muted;
        try {
          localStorage.setItem(LS.muted, muted ? "1" : "0");
        } catch {}
        safe(() =>
          muted ? yt.mute() : (yt.unMute(), yt.setVolume(Number(vol.value))),
        );
        paintVol();
      });

      wireSeek();
      setNow("재생목록을 불러오는 중…", "");
      transportEnabled(false);
    }

    function wireSeek() {
      const bar = $("#pbProgress");
      const seekTo = (clientX) => {
        if (!ready) return;
        const r = bar.getBoundingClientRect();
        const frac = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
        const dur = safeGet(() => yt.getDuration(), 0);
        if (dur) yt.seekTo(frac * dur, true);
        paint(frac * dur, dur);
      };
      bar.addEventListener("pointerdown", (e) => {
        dragging = true;
        bar.classList.add("dragging");
        bar.setPointerCapture(e.pointerId);
        seekTo(e.clientX);
      });
      bar.addEventListener("pointermove", (e) => {
        if (dragging) seekTo(e.clientX);
      });
      const end = (e) => {
        if (!dragging) return;
        dragging = false;
        bar.classList.remove("dragging");
        try {
          bar.releasePointerCapture(e.pointerId);
        } catch {}
      };
      bar.addEventListener("pointerup", end);
      bar.addEventListener("pointercancel", end);
      bar.addEventListener("keydown", (e) => {
        if (!ready) return;
        const dur = safeGet(() => yt.getDuration(), 0);
        const cur = safeGet(() => yt.getCurrentTime(), 0);
        if (e.key === "ArrowRight") {
          yt.seekTo(Math.min(dur, cur + 5), true);
          e.preventDefault();
        }
        if (e.key === "ArrowLeft") {
          yt.seekTo(Math.max(0, cur - 5), true);
          e.preventDefault();
        }
      });
    }

    // ---------- 큐 설정 ----------
    function setQueue(list, playlistId) {
      queueSongs = (list || []).filter((s) => s.youtube_id);
      listId = (playlistId || "").trim();
      videoIds = queueSongs.map((s) => s.youtube_id);
      renderQueue();

      if (!listId && !videoIds.length) {
        setNow(
          "재생할 곡이 없어요",
          "관리자에서 재생목록 ID 또는 곡을 추가하세요",
        );
        transportEnabled(false);
        return;
      }
      transportEnabled(true);
      setNow(
        listId ? "유튜브 재생목록" : `${videoIds.length}곡 대기 중`,
        "재생 버튼을 눌러주세요",
      );
      ensureApi(createPlayer);
    }

    function transportEnabled(on) {
      [
        "#pbPlay",
        "#pbPrev",
        "#pbNext",
        "#pbShuffle",
        "#pbRepeat",
        "#pbVideo",
      ].forEach((s) => {
        const e = $(s);
        if (e) e.disabled = !on;
      });
    }

    function ensureApi(cb) {
      if (window.YT && window.YT.Player) {
        cb();
        return;
      }
      const prevHook = window.onYouTubeIframeAPIReady; // 기존 훅 보존
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevHook === "function") prevHook();
        cb();
      };
      if (!apiRequested) {
        apiRequested = true;
        const s = document.createElement("script");
        s.id = "yt-api";
        s.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
    }

    function createPlayer() {
      if (yt) {
        loadQueueIntoPlayer(true);
        return;
      }
      yt = new YT.Player("yt-mount", {
        height: "180",
        width: "320",
        playerVars: { controls: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            ready = true;
            applyVolume();
            if (shuffle) safe(() => yt.setShuffle(true));
            loadQueueIntoPlayer(true);
            if (pending) {
              const p = pending;
              pending = null;
              p();
            }
          },
          onStateChange: onState,
          onError: () =>
            toast("이 곡은 재생할 수 없어요. 다음 곡으로 넘어갑니다", true),
        },
      });
    }

    function loadQueueIntoPlayer(cueOnly) {
      if (!ready) return;
      const fn = cueOnly ? "cuePlaylist" : "loadPlaylist";
      safe(() => {
        if (listId) yt[fn]({ listType: "playlist", list: listId, index: 0 });
        else yt[fn](videoIds, 0);
      });
    }

    function applyVolume() {
      const v = Number($("#pbVolume").value);
      safe(() => {
        if (localStorage.getItem(LS.muted) === "1") yt.mute();
        else {
          yt.unMute();
          yt.setVolume(v);
        }
      });
    }

    // ---------- 상태 ----------
    function onState(e) {
      const playing = e.data === YT.PlayerState.PLAYING;
      document.body.classList.toggle("is-playing", playing);
      updatePlayIcon(playing);
      if (playing) {
        updateNow();
        startTimer();
      } else stopTimer();
      // 현재 곡 카드: 실제로 재생 중일 때만 "재생 중" 뱃지
      $$(".song-entry.is-current").forEach((c) =>
        c.classList.toggle("is-playing", playing),
      );
      if (e.data === YT.PlayerState.CUED || e.data === YT.PlayerState.BUFFERING)
        updateNow();
      if (e.data === YT.PlayerState.ENDED && repeat === "one")
        safe(() => {
          yt.seekTo(0, true);
          yt.playVideo();
        });
    }

    function startTimer() {
      stopTimer();
      timer = setInterval(tick, 250);
    }
    function stopTimer() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    function tick() {
      if (!ready || dragging) return;
      paint(
        safeGet(() => yt.getCurrentTime(), 0),
        safeGet(() => yt.getDuration(), 0),
      );
    }
    function paint(cur, dur) {
      const pct = dur ? (cur / dur) * 100 : 0;
      $("#pbFill").style.width = pct + "%";
      $("#pbLineFill").style.width = pct + "%";
      $("#pbProgress").style.setProperty("--pb-knob", pct + "%");
      $("#pbProgress").setAttribute("aria-valuenow", String(Math.round(pct)));
      $("#pbCur").textContent = fmt(cur);
      $("#pbDur").textContent = fmt(dur);
    }

    function updateNow() {
      const d = safeGet(() => yt.getVideoData(), null) || {};
      const vid = d.video_id || "";
      const song = queueSongs.find((s) => s.youtube_id === vid);
      setNow(
        song?.title || d.title || "재생 중",
        song?.artist || d.author || "",
      );
      if (song?.album_cover_url) $("#pbArt").src = song.album_cover_url;
      else if (vid)
        $("#pbArt").src = `https://i.ytimg.com/vi/${vid}/default.jpg`;
      if (vid !== currentVid) {
        currentVid = vid;
        markPlayingCard(vid);
        renderQueue();
      }
    }

    function setNow(title, artist) {
      $("#pbTitle").textContent = title;
      $("#pbArtist").textContent = artist || "";
      $("#pbNow").title = artist ? `${title} — ${artist}` : title;
    }

    function updatePlayIcon(playing) {
      $("#pbPlay").innerHTML = playing ? ICON.pause : ICON.play;
      $("#pbPlay").setAttribute("aria-label", playing ? "일시정지" : "재생");
    }

    function markPlayingCard(vid) {
      $$(".song-entry").forEach((c) => {
        const isCur = !!vid && c.dataset.vid === vid;
        c.classList.toggle("is-current", isCur);
        if (!isCur) c.classList.remove("is-playing");
      });
    }

    function scrollToCurrent() {
      const card = $(".song-entry.is-current");
      if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
      else toggleQueue();
    }

    // ---------- 조작 ----------
    function playPause() {
      if (!ready) {
        pending = playPause;
        ensureApi(createPlayer);
        return;
      }
      const st = safeGet(() => yt.getPlayerState(), -1);
      if (st === YT.PlayerState.PLAYING) yt.pauseVideo();
      else yt.playVideo();
    }
    function next() {
      safe(() => yt.nextVideo());
    }
    function prev() {
      if (!ready) return;
      if (safeGet(() => yt.getCurrentTime(), 0) > 3) {
        yt.seekTo(0, true);
        return;
      }
      safe(() => yt.previousVideo());
    }

    function playSong(song) {
      if (!song?.youtube_id) {
        toast("이 곡에는 유튜브 영상이 연결되어 있지 않아요", true);
        return;
      }
      if (!ready) {
        pending = () => playSong(song);
        ensureApi(createPlayer);
        return;
      }
      const list = safeGet(() => yt.getPlaylist(), null) || [];
      const idx = list.indexOf(song.youtube_id);
      if (idx >= 0) safe(() => yt.playVideoAt(idx));
      else safe(() => yt.loadVideoById(song.youtube_id));
      safe(() => yt.playVideo());
      closeQueue();
    }

    // ---------- 재생 목록 패널 ----------
    function renderQueue() {
      const list = $("#qpList");
      if (!list) return;
      list.innerHTML = "";
      $("#qpCount").textContent = queueSongs.length
        ? `${queueSongs.length}곡`
        : "";

      if (!queueSongs.length) {
        const msg = listId
          ? "유튜브 재생목록으로 재생 중입니다.\n곡 카드에 유튜브 ID를 넣으면 여기에 목록이 표시돼요."
          : "재생할 곡이 없습니다.\n관리자에서 곡을 추가해주세요.";
        list.innerHTML = `<div class="qp-empty">${esc(msg)}</div>`;
        return;
      }
      queueSongs.forEach((s, i) => {
        const b = el("button", "qp-item");
        b.type = "button";
        if (s.youtube_id === currentVid) b.classList.add("current");
        b.appendChild(textEl("span", "qp-num", String(i + 1)));
        const th = el("img", "qp-thumb");
        th.src =
          s.album_cover_url ||
          `https://i.ytimg.com/vi/${s.youtube_id}/default.jpg`;
        th.alt = "";
        th.loading = "lazy";
        b.appendChild(th);
        const meta = el("span", "qp-meta");
        meta.appendChild(textEl("span", "qp-title", s.title || "(제목 없음)"));
        if (s.artist) meta.appendChild(textEl("span", "qp-artist", s.artist));
        b.appendChild(meta);
        b.addEventListener("click", () => playSong(s));
        list.appendChild(b);
      });
    }

    function toggleQueue() {
      const p = $("#queuePanel");
      const open = p.hidden;
      p.hidden = !open;
      // hidden 속성만 믿지 않고 인라인 display도 직접 강제 (캐시된 구버전 CSS 대비 이중 안전장치)
      if (open) p.style.removeProperty("display");
      else p.style.setProperty("display", "none", "important");
      $("#pbQueue").classList.toggle("active", open);
      $("#pbQueue").setAttribute("aria-expanded", String(open));
    }
    function closeQueue() {
      const p = $("#queuePanel");
      p.hidden = true;
      p.style.setProperty("display", "none", "important");
      $("#pbQueue").classList.remove("active");
      $("#pbQueue").setAttribute("aria-expanded", "false");
    }

    // ---------- 내부 유틸 ----------
    function safe(fn) {
      try {
        if (yt && ready) fn();
      } catch (_) {}
    }
    function safeGet(fn, dflt) {
      try {
        return yt && ready ? fn() : dflt;
      } catch (_) {
        return dflt;
      }
    }
    function fmt(s) {
      s = Math.floor(s || 0);
      const m = Math.floor(s / 60);
      return `${m}:${String(s % 60).padStart(2, "0")}`;
    }

    return {
      mount,
      setQueue,
      playSong,
      playPause,
      next,
      prev,
      toggleQueue,
      closeQueue,
    };
  })();

  // ============================================================
  //  방명록
  // ============================================================
  async function loadGuestbook() {
    const list = $("#gbList");
    list.innerHTML = '<div class="gb-empty">불러오는 중…</div>';
    if (!sb) {
      list.innerHTML =
        '<div class="gb-empty">Supabase 설정이 필요합니다.</div>';
      return;
    }
    const { data, error } = await sb
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      list.innerHTML = `<div class="gb-empty">불러오기 실패: ${esc(error.message)}</div>`;
      return;
    }
    renderGuestbook(data || []);
  }

  function renderGuestbook(entries) {
    const list = $("#gbList");
    $("#gbCount").textContent = entries.length ? `${entries.length}` : "";
    markGbSeen(entries.length);
    if (!entries.length) {
      list.innerHTML =
        '<div class="gb-empty">아직 방명록이 비어 있어요.\n첫 인사를 남겨보세요.</div>';
      return;
    }
    list.innerHTML = "";
    entries.forEach((e) => list.appendChild(buildGbEntry(e)));
  }

  function buildGbEntry(e, fresh) {
    const box = el("div", "gb-entry" + (fresh ? " fresh" : ""));
    const top = el("div", "gb-top");
    top.appendChild(textEl("span", "gb-name", e.name || "익명"));
    top.appendChild(textEl("span", "gb-time", relTime(e.created_at)));
    box.appendChild(top);
    box.appendChild(textEl("div", "gb-msg", e.message || ""));
    return box;
  }

  async function submitGuestbook(ev) {
    ev.preventDefault();
    if (!sb) {
      toast("Supabase 설정이 필요합니다", true);
      return;
    }
    const nameEl = $("#gbName"),
      msgEl = $("#gbMsg");
    const name = nameEl.value.trim(),
      message = msgEl.value.trim();
    if (!name || !message) return;
    const btn = ev.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    const { error } = await sb.from("guestbook").insert({ name, message });
    btn.disabled = false;
    if (error) {
      toast("등록 실패: " + error.message, true);
      return;
    }
    msgEl.value = "";
    updateCounter();
    toast("방명록을 남겼어요 ✦");
    await loadGuestbook();
    $("#gbList").scrollTop = 0;
  }

  function setupGuestbookRealtime() {
    if (!sb) return;
    try {
      sb.channel("gb-rt")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "guestbook" },
          () => {
            if (!$("#gbModal").hidden) loadGuestbook();
            else prefetchGuestbookCount();
          },
        )
        .subscribe();
    } catch {}
  }

  // 새 방명록이 있으면 바 아이콘에 점 표시
  async function prefetchGuestbookCount() {
    if (!sb) return;
    const { count, error } = await sb
      .from("guestbook")
      .select("id", { count: "exact", head: true });
    if (error || count == null) return;
    const seen = getNum(LS.gbSeen, -1);
    $("#pbGuest").classList.toggle("has-new", seen >= 0 && count > seen);
    if (seen < 0) markGbSeen(count);
  }
  function markGbSeen(n) {
    try {
      localStorage.setItem(LS.gbSeen, String(n));
    } catch {}
    $("#pbGuest")?.classList.remove("has-new");
  }

  function updateCounter() {
    const v = $("#gbMsg").value.length;
    const c = $("#gbCounter");
    c.textContent = `${v} / 500`;
    c.classList.toggle("over", v >= 500);
  }

  // ============================================================
  //  헤더 / 모달 / 단축키
  // ============================================================
  function wireChrome() {
    setHTML("#collapseAllBtn .ico", ICON.chevron);
    fillIcon("#gbClose", ICON.x);

    // 전체 접기/펼치기
    let allCollapsed = false;
    const cab = $("#collapseAllBtn");
    cab?.addEventListener("click", () => {
      allCollapsed = !allCollapsed;
      setAllCollapsed(allCollapsed);
      cab.querySelector(".label").textContent = allCollapsed
        ? "전체 펼치기"
        : "전체 접기";
    });

    // 재생 목록 패널
    $("#pbQueue")?.addEventListener("click", (e) => {
      e.stopPropagation();
      Player.toggleQueue();
    });
    document.addEventListener("click", (e) => {
      if (
        !$("#queuePanel").hidden &&
        !e.target.closest("#queuePanel") &&
        !e.target.closest("#pbQueue")
      )
        Player.closeQueue();
    });

    // 방명록 모달
    const modal = $("#gbModal");
    let lastFocus = null;
    const open = () => {
      lastFocus = document.activeElement;
      modal.hidden = false;
      modal.style.removeProperty("display"); // CSS의 flex 레이아웃이 다시 적용되도록
      document.body.classList.add("modal-open");
      Player.closeQueue();
      loadGuestbook();
      setTimeout(() => $("#gbName").focus(), 60);
    };
    const close = () => {
      modal.hidden = true;
      // hidden 속성만 믿지 않고 인라인 display도 직접 강제 (캐시된 구버전 CSS가 남아있어도 반드시 닫히도록)
      modal.style.setProperty("display", "none", "important");
      document.body.classList.remove("modal-open");
      lastFocus?.focus?.();
    };
    $("#pbGuest")?.addEventListener("click", open);
    $("#gbClose")?.addEventListener("click", close);
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
    $("#gbForm")?.addEventListener("submit", submitGuestbook);
    $("#gbMsg")?.addEventListener("input", updateCounter);
    $("#gbMsg")?.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter")
        $("#gbForm").requestSubmit();
    });

    // 모달 포커스 트랩
    modal?.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const f = [
        ...modal.querySelectorAll("button, input, textarea, a[href]"),
      ].filter((x) => !x.disabled && x.offsetParent);
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    });

    // 단축키
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!modal.hidden) return close();
        if (!$("#queuePanel").hidden) return Player.closeQueue();
      }
      const t = e.target;
      const typing =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!modal.hidden) return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          Player.playPause();
          break;
        case "ArrowRight":
          Player.next();
          break;
        case "ArrowLeft":
          Player.prev();
          break;
        case "q":
        case "ㅂ":
          Player.toggleQueue();
          break;
        case "g":
        case "ㅎ":
          open();
          break;
      }
    });
  }

  // ============================================================
  //  유틸
  // ============================================================
  function el(tag, cls) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function textEl(tag, cls, text) {
    const e = el(tag, cls);
    e.textContent = text;
    return e;
  }
  function iconButton(cls, svg, label) {
    const b = el("button", "icon-btn " + cls);
    b.type = "button";
    b.innerHTML = svg;
    b.setAttribute("aria-label", label);
    b.title = label;
    return b;
  }
  function fillIcon(sel, svg) {
    const e = $(sel);
    if (e) e.innerHTML = svg;
  }
  function setText(sel, t) {
    const e = $(sel);
    if (e) e.textContent = t;
  }
  function setHTML(sel, h) {
    const e = $(sel);
    if (e) e.innerHTML = h;
  }
  function renderEmpty(msg) {
    const w = $("#playlist");
    if (w) w.innerHTML = `<div class="empty-state">${esc(msg)}</div>`;
  }
  function esc(s) {
    return String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  }
  function cssUrl(u) {
    return String(u).replace(/["\\)]/g, "");
  }
  function getNum(key, dflt) {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && localStorage.getItem(key) !== null ? v : dflt;
  }

  function relTime(iso) {
    if (!iso) return "";
    const d = new Date(iso),
      diff = (Date.now() - d) / 1000;
    if (diff < 60) return "방금";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  }

  // 뷰어에도 토스트 (기존엔 admin.js에만 있어서 방명록 등록 시 에러가 났음)
  let toastTimer = null;
  function toast(msg, isErr) {
    let t = $("#toast");
    if (!t) {
      t = el("div", "toast");
      t.id = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = "toast"), 2200);
  }

  window.__kotatsu = { reload: () => init() };
})();
