/* =========================================================
   コタツ Playlist — admin (admin.js)
   - 이메일/비밀번호 로그인 (Supabase Auth)
   - 사이트 설정 편집
   - 곡 추가 / 수정 / 삭제 / 순서변경 (말풍선 에디터 포함)
   - 방명록 관리(삭제)
   ========================================================= */
(() => {
  "use strict";

  const CFG = window.KOTATSU_CONFIG || {};
  const isConfigured =
    CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY &&
    !CFG.SUPABASE_URL.includes("여기에") && !CFG.SUPABASE_ANON_KEY.includes("여기에");

  let sb = null;
  let songs = [];
  let editingId = null; // null이면 신규 추가

  // 디자인 커스터마이징 필드: settings 컬럼명 → 폼 id 접두사 / 피커에 보여줄 기본색
  const THEME_ID = {
    bg_color: "setBgColor", panel_color: "setPanelColor", text_color: "setTextColor",
    bubble_left_bg: "setBubbleLBg", bubble_left_text: "setBubbleLText",
    bubble_right_bg: "setBubbleRBg", bubble_right_text: "setBubbleRText",
  };
  const THEME_DEFAULTS = {
    bg_color: "#0b0b0d", panel_color: "#1b1b1d", text_color: "#f4f4f5",
    bubble_left_bg: "#1b1b1d", bubble_left_text: "#7eb27b",
    bubble_right_bg: "#1b1b1d", bubble_right_text: "#7eb27b",
  };

  const $ = (s) => document.querySelector(s);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!isConfigured) {
      $("#loginView").innerHTML =
        '<div class="login-card"><h1>설정 필요</h1><p>config.js에 Supabase URL과 anon 키를 먼저 넣어주세요. 자세한 건 README.md 참고.</p></div>';
      show("login");
      return;
    }
    if (!window.supabase) { alert("Supabase 라이브러리를 불러오지 못했습니다."); return; }
    sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

    wireLogin();
    wirePanel();

    const { data } = await sb.auth.getSession();
    if (data.session) enterPanel(data.session);
    else show("login");

    sb.auth.onAuthStateChange((_e, session) => {
      if (session) enterPanel(session);
      else show("login");
    });
  }

  function show(which) {
    $("#loginView").classList.toggle("hidden", which !== "login");
    $("#panelView").classList.toggle("hidden", which !== "panel");
  }

  // ============================================================
  //  로그인
  // ============================================================
  function wireLogin() {
    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#liEmail").value.trim();
      const password = $("#liPw").value;
      const err = $("#loginError");
      err.textContent = "";
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      const { error } = await sb.auth.signInWithPassword({ email, password });
      btn.disabled = false;
      if (error) err.textContent = "로그인 실패: " + error.message;
    });
  }

  async function enterPanel(session) {
    show("panel");
    $("#whoami").textContent = session.user?.email || "";
    await Promise.all([loadSettingsForm(), loadSongsAdmin(), loadGuestbookAdmin()]);
  }

  // ============================================================
  //  설정 폼
  // ============================================================
  async function loadSettingsForm() {
    const { data, error } = await sb.from("settings").select("*").eq("id", 1).maybeSingle();
    if (error) { toast("설정 불러오기 실패: " + error.message, true); return; }
    const s = data || {};
    $("#setTitle").value = s.site_title || "";
    $("#setSubtitle").value = s.site_subtitle || "";
    $("#setBg").value = s.bg_image_url || "";
    $("#setPlaylist").value = s.youtube_playlist_id || "";
    $("#setAccent").value = s.accent_color || "#7eb27b";
    $("#setAccentHex").value = s.accent_color || "#7eb27b";
    $("#setCss").value = s.custom_css || "";

    for (const key in THEME_ID) {
      const id = THEME_ID[key];
      $(`#${id}`).value = s[key] || THEME_DEFAULTS[key];
      $(`#${id}Hex`).value = s[key] || "";
    }
    updateBubblePreview();
  }

  function wirePanel() {
    $("#logoutBtn").addEventListener("click", () => sb.auth.signOut());

    // 컬러피커 ↔ 헥스 텍스트 동기화 (강조색 + 디자인 필드 전부 공용)
    wireColorPair("setAccent", "setAccentHex");
    for (const key in THEME_ID) wireColorPair(THEME_ID[key], `${THEME_ID[key]}Hex`, updateBubblePreview);
    $("#resetThemeBtn")?.addEventListener("click", resetTheme);

    $("#settingsForm").addEventListener("submit", saveSettings);

    // 곡 추가/수정 폼
    $("#addBubbleBtn").addEventListener("click", () => addBubbleRow());
    $("#songForm").addEventListener("submit", saveSong);
    $("#newSongBtn").addEventListener("click", () => openSongForm(null));
    $("#cancelSongBtn").addEventListener("click", closeSongForm);
  }

  function wireColorPair(colorId, hexId, onChange) {
    const c = $(`#${colorId}`), h = $(`#${hexId}`);
    if (!c || !h) return;
    c.addEventListener("input", () => { h.value = c.value; onChange?.(); });
    h.addEventListener("input", () => {
      const v = h.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) c.value = v;
      onChange?.();
    });
  }

  // 말풍선 좌/우 실시간 미리보기 (저장 전 폼 값 기준)
  function updateBubblePreview() {
    const lb = $("#bubblePreviewLeft"), rb = $("#bubblePreviewRight");
    if (!lb || !rb) return;
    lb.style.background = $("#setBubbleLBgHex").value.trim() || THEME_DEFAULTS.bubble_left_bg;
    lb.style.color = $("#setBubbleLTextHex").value.trim() || THEME_DEFAULTS.bubble_left_text;
    rb.style.background = $("#setBubbleRBgHex").value.trim() || THEME_DEFAULTS.bubble_right_bg;
    rb.style.color = $("#setBubbleRTextHex").value.trim() || THEME_DEFAULTS.bubble_right_text;
  }

  // 디자인 필드를 기본값으로 되돌림(폼만 초기화 — "저장"을 눌러야 실제 반영됨)
  function resetTheme() {
    for (const key in THEME_ID) {
      const id = THEME_ID[key];
      $(`#${id}`).value = THEME_DEFAULTS[key];
      $(`#${id}Hex`).value = "";
    }
    updateBubblePreview();
    toast("디자인이 기본값으로 초기화됐어요 (저장을 눌러야 사이트에 반영돼요)");
  }

  async function saveSettings(e) {
    e.preventDefault();
    const payload = {
      site_title: $("#setTitle").value.trim() || "コタツ",
      site_subtitle: $("#setSubtitle").value.trim(),
      bg_image_url: $("#setBg").value.trim(),
      youtube_playlist_id: extractPlaylistId($("#setPlaylist").value.trim()),
      accent_color: $("#setAccentHex").value.trim() || "#7eb27b",
      custom_css: $("#setCss").value,
    };
    // 디자인 필드: 비워두면 빈 문자열로 저장 → 사이트에서는 기본값(패널/강조색 연동)을 그대로 사용
    for (const key in THEME_ID) payload[key] = $(`#${THEME_ID[key]}Hex`).value.trim();

    const { error } = await sb.from("settings").update(payload).eq("id", 1);
    if (error) toast("저장 실패: " + error.message, true);
    else toast("설정을 저장했어요 ✦");
  }

  // ============================================================
  //  곡 목록 (관리)
  // ============================================================
  async function loadSongsAdmin() {
    const { data, error } = await sb.from("songs").select("*")
      .order("position", { ascending: true }).order("created_at", { ascending: true });
    if (error) { toast("곡 불러오기 실패: " + error.message, true); return; }
    songs = data || [];
    renderSongsAdmin();
  }

  function renderSongsAdmin() {
    const wrap = $("#songList");
    $("#songCount").textContent = songs.length ? `${songs.length}곡` : "0곡";
    wrap.innerHTML = "";
    if (!songs.length) { wrap.innerHTML = '<p class="hint">아직 곡이 없습니다. “곡 추가”로 시작하세요.</p>'; return; }

    songs.forEach((song, i) => {
      const row = el("div", "admin-song");
      const order = el("div", "order-btns");
      const up = btn("▲", () => move(i, -1)); up.disabled = i === 0;
      const down = btn("▼", () => move(i, 1)); down.disabled = i === songs.length - 1;
      order.append(up, down);

      const img = el("img"); img.src = song.album_cover_url || ""; img.alt = "";

      const meta = el("div", "as-meta");
      meta.appendChild(textEl("div", "as-title", song.title || "(제목 없음)"));
      meta.appendChild(textEl("div", "as-artist", song.artist || ""));

      const actions = el("div", "as-actions");
      actions.appendChild(btnCls("btn btn-sm", "수정", () => openSongForm(song.id)));
      actions.appendChild(btnCls("btn btn-sm btn-danger", "삭제", () => deleteSong(song)));

      row.append(order, img, meta, actions);
      wrap.appendChild(row);
    });
  }

  async function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= songs.length) return;
    const a = songs[i], b = songs[j];
    const pa = a.position, pb = b.position;
    // position 교환 (동일하면 인덱스 기반 보정)
    const newA = pb !== pa ? pb : j;
    const newB = pb !== pa ? pa : i;
    const [r1, r2] = await Promise.all([
      sb.from("songs").update({ position: newA }).eq("id", a.id),
      sb.from("songs").update({ position: newB }).eq("id", b.id),
    ]);
    if (r1.error || r2.error) { toast("순서 변경 실패", true); return; }
    await loadSongsAdmin();
  }

  async function deleteSong(song) {
    if (!confirm(`"${song.title}" 곡을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const { error } = await sb.from("songs").delete().eq("id", song.id);
    if (error) { toast("삭제 실패: " + error.message, true); return; }
    toast("삭제했어요");
    if (editingId === song.id) closeSongForm();
    await loadSongsAdmin();
  }

  // ============================================================
  //  곡 추가/수정 폼
  // ============================================================
  function openSongForm(id) {
    editingId = id;
    const song = id ? songs.find((s) => s.id === id) : null;
    $("#songFormTitle").textContent = song ? "곡 수정" : "곡 추가";
    $("#fTitle").value = song?.title || "";
    $("#fArtist").value = song?.artist || "";
    $("#fYoutube").value = song?.youtube_id || "";
    $("#fCover").value = song?.album_cover_url || "";
    $("#fBg").value = song?.bg_image_url || "";
    $("#fAccent").value = song?.accent_color || "";
    $("#fLyrics").value = song?.lyrics || "";
    $("#fQuote").value = song?.quote || "";
    $("#fTrivia").value = song?.trivia || "";

    // 말풍선
    $("#bubbleEditor").innerHTML = "";
    const bubbles = parseBubbles(song?.bubbles);
    if (bubbles.length) bubbles.forEach((b) => addBubbleRow(b.side, b.text));
    else addBubbleRow();

    $("#songFormCard").classList.remove("hidden");
    $("#songFormCard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeSongForm() {
    editingId = null;
    $("#songForm").reset();
    $("#bubbleEditor").innerHTML = "";
    $("#songFormCard").classList.add("hidden");
  }

  function addBubbleRow(side = "left", text = "") {
    const row = el("div", "bubble-row");

    const sel = el("select", "b-side");
    [["left", "왼쪽 (상대 대사)"], ["right", "오른쪽 (내 대사)"]].forEach(([v, label]) => {
      const o = document.createElement("option"); o.value = v; o.textContent = label;
      if (v === side) o.selected = true; sel.appendChild(o);
    });

    const ta = el("textarea", "b-text"); ta.value = text; ta.placeholder = "말풍선 내용 (롤플레이 텍스트)";
    ta.rows = 3;

    const rm = btnCls("btn btn-sm btn-danger b-remove", "삭제", () => row.remove());

    row.append(sel, ta, rm);
    $("#bubbleEditor").appendChild(row);
  }

  function collectBubbles() {
    const rows = [...document.querySelectorAll("#bubbleEditor .bubble-row")];
    return rows
      .map((r) => ({ side: r.querySelector(".b-side").value, text: r.querySelector(".b-text").value.trim() }))
      .filter((b) => b.text.length > 0);
  }

  async function saveSong(e) {
    e.preventDefault();
    const title = $("#fTitle").value.trim();
    if (!title) { toast("제목은 필수입니다", true); return; }

    const payload = {
      title,
      artist: $("#fArtist").value.trim() || null,
      youtube_id: extractYouTubeId($("#fYoutube").value.trim()) || null,
      album_cover_url: $("#fCover").value.trim() || null,
      bg_image_url: $("#fBg").value.trim() || null,
      accent_color: $("#fAccent").value.trim() || null,
      lyrics: $("#fLyrics").value || null,
      quote: $("#fQuote").value.trim() || null,
      trivia: $("#fTrivia").value.trim() || null,
      bubbles: collectBubbles(),
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    let error;
    if (editingId) {
      ({ error } = await sb.from("songs").update(payload).eq("id", editingId));
    } else {
      payload.position = (songs.reduce((m, s) => Math.max(m, s.position || 0), 0) || 0) + 1;
      ({ error } = await sb.from("songs").insert(payload));
    }
    btn.disabled = false;

    if (error) { toast("저장 실패: " + error.message, true); return; }
    toast(editingId ? "곡을 수정했어요 ✦" : "곡을 추가했어요 ✦");
    closeSongForm();
    await loadSongsAdmin();
  }

  // 유튜브 ID 또는 다양한 형태의 URL에서 ID 추출
  function extractYouTubeId(input) {
    if (!input) return "";
    if (/^[\w-]{11}$/.test(input)) return input; // 이미 ID
    const m =
      input.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([\w-]{11})/) ||
      input.match(/([\w-]{11})/);
    return m ? m[1] : input;
  }

  // 재생목록 링크 또는 ID에서 재생목록 ID 추출 (list= 파라미터 우선)
  function extractPlaylistId(input) {
    if (!input) return "";
    const m = input.match(/[?&]list=([\w-]+)/);
    if (m) return m[1];
    // 순수 ID로 보이면 그대로 (PL..., OLAK5uy_..., RD..., UU..., FL... 등)
    if (/^[\w-]{12,}$/.test(input)) return input;
    return input;
  }

  // ============================================================
  //  방명록 관리
  // ============================================================
  async function loadGuestbookAdmin() {
    const wrap = $("#gbAdminList");
    wrap.innerHTML = '<p class="hint">불러오는 중…</p>';
    const { data, error } = await sb.from("guestbook").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) { wrap.innerHTML = `<p class="hint">불러오기 실패: ${esc(error.message)}</p>`; return; }
    const entries = data || [];
    $("#gbAdminCount").textContent = entries.length ? `${entries.length}개` : "0개";
    if (!entries.length) { wrap.innerHTML = '<p class="hint">방명록이 비어 있습니다.</p>'; return; }
    wrap.innerHTML = "";
    entries.forEach((eRow) => {
      const box = el("div", "gb-entry");
      const top = el("div", "gb-top");
      top.appendChild(textEl("span", "gb-name", eRow.name || "익명"));
      top.appendChild(textEl("span", "gb-time", new Date(eRow.created_at).toLocaleString("ko-KR")));
      box.appendChild(top);
      box.appendChild(textEl("div", "gb-msg", eRow.message || ""));
      const foot = el("div", "gb-foot");
      const del = btnCls("btn btn-sm btn-danger gb-del", "삭제", async () => {
        if (!confirm("이 방명록을 삭제할까요?")) return;
        const { error } = await sb.from("guestbook").delete().eq("id", eRow.id);
        if (error) { toast("삭제 실패", true); return; }
        loadGuestbookAdmin();
      });
      foot.appendChild(del);
      box.appendChild(foot);
      wrap.appendChild(box);
    });
  }

  // ============================================================
  //  유틸
  // ============================================================
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function textEl(tag, cls, text) { const e = el(tag, cls); e.textContent = text; return e; }
  function btn(label, onClick) { const b = el("button"); b.type = "button"; b.textContent = label; b.addEventListener("click", onClick); return b; }
  function btnCls(cls, label, onClick) { const b = el("button", cls); b.type = "button"; b.textContent = label; b.addEventListener("click", onClick); return b; }
  function parseBubbles(raw) {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") { try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; } }
    return [];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  let toastTimer = null;
  function toast(msg, isErr) {
    let t = $("#toast");
    if (!t) { t = el("div", "toast"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = "toast"), 2200);
  }
})();
