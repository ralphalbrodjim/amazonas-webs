/* Same public client as shared/supabase.config.ts. The publishable key is meant to ship in the page. */
(function () {
  const URL = "https://njspskcisrwmtmbcbdny.supabase.co";
  const KEY = "sb_publishable_m5lCQ6zHDJQ1XVK5ZbeuRg_j7JeK1PH";
  const AUTH = "ch-auth";
  let session = null;
  let schemaReady = false;

  function $(id) { return document.getElementById(id); }
  function loadAuth() {
    try { session = JSON.parse(localStorage.getItem(AUTH) || "null"); } catch { session = null; }
    if (session && session.expires_at && session.expires_at * 1000 < Date.now() + 15000) session = null;
  }
  function saveAuth(next) {
    session = next;
    if (next) localStorage.setItem(AUTH, JSON.stringify(next));
    else localStorage.removeItem(AUTH);
    paintAccount();
  }
  async function authPost(path, body) {
    const res = await fetch(URL + path, {
      method: "POST",
      headers: { apikey: KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error_description || data.msg || data.message || "No se pudo entrar");
    return data;
  }
  async function rest(path, options) {
    const method = (options && options.method) || "GET";
    const headers = { apikey: KEY, "Content-Type": "application/json", Prefer: (options && options.prefer) || "return=representation" };
    if (session && session.access_token) headers.Authorization = "Bearer " + session.access_token;
    const res = await fetch(URL + path, { method, headers, body: options && options.body ? JSON.stringify(options.body) : undefined });
    const text = await res.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = { message: text }; } }
    if (!res.ok) {
      const message = (data && (data.message || data.error || data.hint)) || res.statusText;
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }
    return data;
  }
  function rpc(name, args) {
    return rest("/rest/v1/rpc/" + name, { method: "POST", body: args });
  }
  function pending(message) {
    return { pending: true, message: message };
  }
  function schemaMessage(error) {
    const text = String(error && error.message || error || "");
    if (/ch_|schema cache|relation|function/i.test(text)) return "Corrección pendiente: faltan las migraciones en Supabase.";
    return "Corrección pendiente: " + text;
  }
  function weekStart() {
    const x = new Date();
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    return x.toISOString().slice(0, 10);
  }
  function paintAccount() {
    const chip = $("account-chip");
    if (!chip) return;
    chip.textContent = session && session.user ? session.user.email : "Sin cuenta";
    const out = $("auth-out");
    if (out) out.hidden = !session;
  }
  async function ensureProfile() {
    if (!session || !session.user) return;
    const existing = await rest("/rest/v1/ch_profiles?select=user_id&limit=1");
    if (Array.isArray(existing) && existing.length) return;
    try {
      await rest("/rest/v1/ch_profiles?on_conflict=user_id", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=minimal",
        body: { user_id: session.user.id, email: session.user.email || null },
      });
    } catch (error) {
      const again = await rest("/rest/v1/ch_profiles?select=user_id&limit=1");
      if (Array.isArray(again) && again.length) return;
      throw error;
    }
  }
  async function pull() {
    await ensureProfile();
    const bank = await rest("/rest/v1/ch_exercise_bank?select=id,code,skill,part&order=sort");
    schemaReady = true;
    const byId = {};
    bank.forEach((row) => { byId[row.id] = row; });
    const [profiles, errors, vocab, attempts, sessions, mocks, writings, speakings, catalog] = await Promise.all([
      rest("/rest/v1/ch_profiles?select=*"),
      rest("/rest/v1/ch_error_book?select=*&order=last_seen.desc"),
      rest("/rest/v1/ch_vocabulary_items?select=*&order=created_at.desc"),
      rest("/rest/v1/ch_exercise_attempts?select=*&order=submitted_at.desc"),
      rest("/rest/v1/ch_study_sessions?select=*&order=started_at.desc"),
      rest("/rest/v1/ch_mock_attempts?select=*&order=finished_at.desc"),
      rest("/rest/v1/ch_writing_submissions?select=*&order=submitted_at.desc"),
      rest("/rest/v1/ch_speaking_sessions?select=*&order=started_at.desc"),
      rest("/rest/v1/ch_resource_catalog?select=*&order=title"),
    ]);
    const profile = profiles && profiles[0] || null;
    const week = weekStart();
    const reported = [false, false, false, false, false, false, false];
    let seconds = 0;
    let completed = 0;
    (sessions || []).forEach((row) => {
      if (row.measured && row.status === "completed") seconds += row.elapsed_seconds || 0;
      if (String(row.week_start).slice(0, 10) === week && row.status === "completed") {
        reported[row.week_day] = true;
        completed += 1;
      }
    });
    const attemptsBox = { grammar: { n: 0, ok: 0 }, reading: { n: 0, ok: 0 }, listening: { n: 0, ok: 0 }, vocab: { n: 0, ok: 0 } };
    let done = 0;
    let correct = 0;
    let points = 0;
    (attempts || []).forEach((row) => {
      if (!row.counts) return;
      const skill = (byId[row.exercise_id] || {}).skill;
      const bucket = skill === "grammar" || skill === "placement" ? "grammar" : attemptsBox[skill] ? skill : null;
      if (row.status !== "empty") done += 1;
      if (row.points) { correct += 1; points += row.points; }
      if (bucket && row.status !== "review" && row.status !== "empty") {
        attemptsBox[bucket].n += 1;
        if (row.status === "correct") attemptsBox[bucket].ok += 1;
      }
    });
    let speakingTurns = 0;
    (speakings || []).forEach((row) => { speakingTurns += Array.isArray(row.turns) ? row.turns.length : 0; });
    const activity = [];
    (mocks || []).slice(0, 6).forEach((row) => activity.push({ label: "Simulacro " + row.kind + " · " + row.total_points + "/" + row.total_max + (row.early_stop ? " · incompleto" : ""), time: row.finished_at }));
    (attempts || []).slice(0, 8).forEach((row) => activity.push({ label: ((byId[row.exercise_id] || {}).code || "Ejercicio") + " · " + row.status, time: row.submitted_at }));
    if (window.chApplyServer) window.chApplyServer({
      profile, errors: errors || [], vocab: (vocab || []).map((row) => row.lemma),
      attempts: attemptsBox, seconds, reported, done, correct, points, sessionCount: completed,
      activity, speakingTurns, mocks: mocks || [], writings: writings || [], speakings: speakings || [],
    });
    if (catalog && catalog.length && window.chRenderCatalog) window.chRenderCatalog(catalog);
    return true;
  }
  async function grade(code, answer, origin, audioOpened) {
    if (!code) return pending("Esta pregunta todavía no tiene código en el banco.");
    if (!session) return pending("Respuesta guardada solo en esta pantalla. Entra con la cuenta para corregirla en el servidor.");
    try {
      const data = await rpc("ch_grade_exercise", { p_code: code, p_answer: String(answer), p_origin: origin || "clase", p_audio_opened: !!audioOpened });
      await pull();
      return data;
    } catch (error) {
      return pending(schemaMessage(error));
    }
  }
  async function finishMock(kind, startedAt, answers, audioOpened) {
    if (!session) return pending("El simulacro queda pendiente de corrección hasta que entres con la cuenta.");
    try {
      const data = await rpc("ch_finish_mock", { p_kind: kind, p_started_at: startedAt, p_answers: answers, p_audio_opened: !!audioOpened });
      await pull();
      return data;
    } catch (error) {
      return pending(schemaMessage(error));
    }
  }
  async function submitPlacement(answers) {
    if (!session) return pending("La prueba de nivel se guarda al entrar con la cuenta.");
    try {
      const data = await rpc("ch_submit_placement", { p_answers: answers });
      await pull();
      return data;
    } catch (error) {
      return pending(schemaMessage(error));
    }
  }
  async function reportClass(day, done) {
    const state = window.state;
    if (state) state.reported[day] = done;
    if (!session) return;
    try { await rpc("ch_report_class", { p_week_day: day, p_done: done }); await pull(); }
    catch (error) { note(schemaMessage(error)); }
  }
  async function savePlan(text) {
    if (!session) return;
    try { await rest("/rest/v1/ch_profiles?user_id=eq." + session.user.id, { method: "PATCH", body: { next_plan: text } }); }
    catch (error) { note(schemaMessage(error)); }
  }
  async function saveHomework(list) {
    if (!session) return;
    try { await rest("/rest/v1/ch_profiles?user_id=eq." + session.user.id, { method: "PATCH", body: { homework: list } }); }
    catch (error) { note(schemaMessage(error)); }
  }
  async function addVocab(lemma) {
    if (!session) return;
    try {
      await rest("/rest/v1/ch_vocabulary_items", { method: "POST", body: { user_id: session.user.id, lemma } });
      await pull();
    } catch (error) { note(schemaMessage(error)); }
  }
  async function setError(id, mastered) {
    if (!session || !id) return;
    try {
      await rest("/rest/v1/ch_error_book?id=eq." + id, { method: "PATCH", body: { status: mastered ? "dominado" : "pendiente", due_at: mastered ? null : new Date(Date.now() + 86400000).toISOString() } });
      await pull();
    } catch (error) { note(schemaMessage(error)); }
  }
  async function dropError(id) {
    if (!session || !id) return;
    try { await rest("/rest/v1/ch_error_book?id=eq." + id, { method: "DELETE" }); await pull(); }
    catch (error) { note(schemaMessage(error)); }
  }
  async function saveWriting(payload) {
    if (!session) return pending("El texto se queda en este navegador. Entra para guardarlo en la cuenta.");
    try {
      const rows = await rest("/rest/v1/ch_writing_submissions", { method: "POST", body: {
        user_id: session.user.id, kind: payload.kind, body: payload.body, word_count: payload.words,
        parent_id: payload.parentId || null, prompt_code: payload.kind, status: "teacher_review",
      } });
      const row = rows && rows[0];
      let ai = { pending: true, message: "corrección IA pendiente de activar" };
      if (row) ai = await askAi({ feature: "writing", submission_id: row.id, text: payload.body, kind: payload.kind });
      await pull();
      return Object.assign({ id: row && row.id }, ai);
    } catch (error) {
      return pending(schemaMessage(error));
    }
  }
  async function saveSpeaking(payload) {
    if (!session) return pending("Los turnos se quedan en este navegador hasta que entres.");
    try {
      const rows = await rest("/rest/v1/ch_speaking_sessions", { method: "POST", body: {
        user_id: session.user.id, part: payload.part, duration_target: payload.duration, turn_cap: payload.cap,
        turns: payload.turns, status: "submitted", elapsed_seconds: 0,
      } });
      const row = rows && rows[0];
      let ai = { pending: true, message: "corrección IA pendiente de activar" };
      if (row) ai = await askAi({ feature: "speaking", session_id: row.id, turns: payload.turns, part: payload.part });
      await pull();
      return Object.assign({ id: row && row.id }, ai);
    } catch (error) {
      return pending(schemaMessage(error));
    }
  }
  async function askAi(body) {
    try {
      const res = await fetch(URL + "/functions/v1/ch-correct", {
        method: "POST",
        headers: { apikey: KEY, Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return { pending: true, message: "corrección IA pendiente de activar" };
      const data = await res.json();
      if (data.pending || !data.rubric && !data.feedback) return { pending: true, message: data.message || "corrección IA pendiente de activar" };
      return data;
    } catch {
      return { pending: true, message: "corrección IA pendiente de activar" };
    }
  }
  function note(text) {
    const box = $("auth-msg");
    if (box && text) box.textContent = text;
  }
  async function signIn(email, password) {
    const data = await authPost("/auth/v1/token?grant_type=password", { email, password });
    saveAuth({ access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at, user: data.user });
    await pull();
  }
  async function signUp(email, password) {
    const data = await authPost("/auth/v1/signup", { email, password });
    if (data.access_token) {
      saveAuth({ access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at, user: data.user });
      await pull();
      return "Cuenta creada.";
    }
    return "Cuenta creada. Si el proyecto pide confirmación, abre el correo y luego entra.";
  }
  function signOut() { saveAuth(null); schemaReady = false; }
  function findPrompt(code) {
    const pools = [window.CH_PROMPTS && window.CH_PROMPTS.grammar, window.CH_PROMPTS && window.CH_PROMPTS.reading, window.CH_PROMPTS && window.CH_PROMPTS.listening, window.CH_PROMPTS && window.CH_PROMPTS.vocab, window.CH_PLACEMENT, window.CH_MUESTRA];
    for (const pool of pools) {
      const found = (pool || []).find((item) => item.code === code);
      if (found) return found;
    }
    return null;
  }
  function renderMock(kind) {
    const host = $("mock-host");
    if (!host) return;
    const minutes = window.state ? window.state.duration : 45;
    if (kind === "muestra") { host.innerHTML = ""; return; }
    if (minutes <= 20) {
      host.innerHTML = '<div class="info">Sesión de 20 minutos: solo ejercicios cortos. Un simulacro no cabe.</div>';
      return;
    }
    if (kind === "full" && minutes < 60) {
      host.innerHTML = '<div class="info">El simulacro completo pide una sesión de 60 minutos. Elige 60 en Speaking o haz el mini de 45.</div>';
      return;
    }
    if (kind !== "mini" && minutes < 45) {
      host.innerHTML = '<div class="info">Un simulacro por destreza pide al menos 45 minutos.</div>';
      return;
    }
    const codes = kind === "mini" ? window.CH_MOCKS.mini : kind === "full" ? window.CH_MOCKS.full : window.CH_MOCKS[window.state.mockSkill || "grammar"];
    host.innerHTML = '<p class="mini">' + (kind === "mini" ? "Mini simulacro real · 45 min · partes originales, no un examen oficial." : kind === "full" ? "Simulacro completo · 60 min." : "Simulacro por destreza.") + '</p>' +
      (kind === "skill" ? '<div class="pillset" id="mock-skill"><button data-skillmock="grammar" class="active">Use of English</button><button data-skillmock="reading">Reading</button><button data-skillmock="listening">Listening</button></div>' : "") +
      '<div class="split"><b id="mock-timer">' + (kind === "mini" ? "45:00" : kind === "full" ? "60:00" : "45:00") + '</b><button class="btn primary" id="mock-start" type="button">Iniciar</button></div><div id="mock-questions"></div><div id="mock-result" class="feedback"></div>';
    host.querySelectorAll("[data-skillmock]").forEach((button) => button.onclick = () => {
      window.state.mockSkill = button.dataset.skillmock;
      renderMock("skill");
    });
    $("mock-start").onclick = () => startMock(kind, codes);
  }
  let mockTicker = null;
  function startMock(kind, codes) {
    const seconds = kind === "full" ? 3600 : 2700;
    const end = Date.now() + seconds * 1000;
    const started = new Date().toISOString();
    const questions = $("mock-questions");
    questions.innerHTML = codes.map((code) => {
      const item = findPrompt(code);
      if (!item) return "";
      const field = item.type === "choice"
        ? item.answers.map((option) => '<label><input type="radio" name="mock-' + code + '" value="' + option.replace(/"/g, "&quot;") + '"> ' + option + "</label>").join("")
        : '<input class="input" data-mock-text="' + code + '" placeholder="Type your answer">';
      const audio = item.audioUrl ? '<p><a href="' + item.audioUrl + '" target="_blank" rel="noopener noreferrer" data-mock-audio="' + code + '">Abrir audio real</a></p>' : "";
      return '<div class="exam-q"><b>' + item.q + "</b>" + audio + field + "</div>";
    }).join("") + '<button class="btn primary" id="mock-finish" type="button">Finalizar</button>';
    const audioOpened = {};
    questions.querySelectorAll("[data-mock-audio]").forEach((link) => link.onclick = () => { audioOpened[link.dataset.mockAudio] = true; });
    clearInterval(mockTicker);
    mockTicker = setInterval(() => {
      const left = Math.max(0, end - Date.now());
      const timer = $("mock-timer");
      if (timer) timer.textContent = String(Math.floor(left / 60000)).padStart(2, "0") + ":" + String(Math.floor(left / 1000) % 60).padStart(2, "0");
      if (left <= 0) finish();
    }, 250);
    async function finish() {
      clearInterval(mockTicker);
      const answers = codes.map((code) => {
        const item = findPrompt(code);
        const chosen = document.querySelector('input[name="mock-' + code + '"]:checked');
        const typed = document.querySelector('[data-mock-text="' + code + '"]');
        return { code, answer: chosen ? chosen.value : typed ? typed.value : "" };
      });
      const opened = codes.every((code) => { const item = findPrompt(code); return !item || !item.audioUrl || audioOpened[code]; });
      const result = $("mock-result");
      result.className = "feedback visible";
      result.textContent = "Corrigiendo…";
      const data = await finishMock(kind, started, answers, opened);
      if (data.pending) { result.textContent = data.message; return; }
      result.className = "feedback visible ok";
      result.textContent = (data.early_stop ? "Incompleto. " : "Terminado. ") + data.total_points + " / " + data.total_max + " puntos directos. " + data.duration_seconds + " s. No es una nota Cambridge.";
    }
    $("mock-finish").onclick = finish;
  }
  function bind() {
    const formNote = $("auth-msg");
    const enter = $("auth-in");
    const create = $("auth-up");
    const out = $("auth-out");
    if (enter) enter.onclick = async () => {
      try { await signIn($("auth-email").value.trim(), $("auth-password").value); if (formNote) formNote.textContent = "Sesión abierta. Los datos de la cuenta mandan."; }
      catch (error) { if (formNote) formNote.textContent = error.message; }
    };
    if (create) create.onclick = async () => {
      try { const message = await signUp($("auth-email").value.trim(), $("auth-password").value); if (formNote) formNote.textContent = message; }
      catch (error) { if (formNote) formNote.textContent = error.message; }
    };
    if (out) out.onclick = () => { signOut(); if (formNote) formNote.textContent = "Sesión cerrada. Esta pantalla vuelve a lo guardado en el navegador."; location.reload(); };
    document.querySelectorAll("[data-mock]").forEach((button) => button.onclick = () => {
      document.querySelectorAll("[data-mock]").forEach((other) => other.classList.toggle("active", other === button));
      const sample = $("sample-mock");
      if (sample) sample.classList.toggle("hidden", button.dataset.mock !== "muestra");
      renderMock(button.dataset.mock);
    });
    const place = $("placement-send");
    if (place) place.onclick = async () => {
      const answers = (window.CH_PLACEMENT || []).map((item) => {
        const chosen = document.querySelector('input[name="plc-' + item.code + '"]:checked');
        const typed = document.querySelector('[data-plc="' + item.code + '"]');
        return { code: item.code, answer: chosen ? chosen.value : typed ? typed.value : "" };
      });
      const box = $("placement-result");
      box.className = "feedback visible";
      box.textContent = "Corrigiendo la prueba…";
      const data = await submitPlacement(answers);
      box.textContent = data.pending ? data.message : data.level + " · " + data.points + "/" + data.max + ". No es una nota Cambridge.";
    };
  }
  async function start() {
    loadAuth();
    paintAccount();
    bind();
    renderMock("mini");
    if (!session) return;
    try { await pull(); note("Sesión abierta. Los datos de la cuenta mandan."); }
    catch (error) { note(schemaMessage(error)); }
  }
  window.chCloud = { start, grade, finishMock, submitPlacement, reportClass, savePlan, saveHomework, addVocab, setError, dropError, saveWriting, saveSpeaking, signOut, get session() { return session; }, get schemaReady() { return schemaReady; } };
})();
