const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
let sb = null;
let sbUser = null;
const SB_KEYS = ["insidervn_recent_tickers", "insidervn_recent_persons", "insidervn_watchlist", "insidervn_filters"];

function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  if (typeof supabase === "undefined") { console.warn("Supabase JS not loaded"); return false; }
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  sb.auth.getSession().then(({ data }) => { if (data.session) { sbUser = data.session.user; onSbLogin(); } });
  sb.auth.onAuthStateChange((_e, session) => {
    if (session) { sbUser = session.user; onSbLogin(); }
    else { sbUser = null; updateSbUI(); }
  });
  return true;
}

function sbOpenModal(mode) {
  const m = document.getElementById("sb-modal");
  if (!m) return;
  m.style.display = "flex";
  m.dataset.mode = mode === "up" ? "up" : "in";
  document.getElementById("sb-title").textContent = mode === "up" ? "Tạo tài khoản" : "Đăng nhập";
  document.getElementById("sb-msg").textContent = "";
}

function sbCloseModal() {
  const m = document.getElementById("sb-modal");
  if (m) m.style.display = "none";
}

async function sbSubmit() {
  const m = document.getElementById("sb-modal");
  if (!sb) { document.getElementById("sb-msg").textContent = "Chưa cấu hình Supabase"; return; }
  const email = document.getElementById("sb-email").value.trim();
  const pass = document.getElementById("sb-pass").value;
  const msg = document.getElementById("sb-msg");
  let r;
  if (m.dataset.mode === "up") r = await sb.auth.signUp({ email, password: pass });
  else r = await sb.auth.signInWithPassword({ email, password: pass });
  if (r.error) { msg.textContent = r.error.message; return; }
  if (m.dataset.mode === "up" && r.data && !r.data.session) { msg.textContent = "Đã gửi email xác nhận."; return; }
  sbCloseModal();
}

async function sbSignOut() {
  if (sb) await sb.auth.signOut();
}

function snapshotLocal() {
  const o = {};
  SB_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v) o[k] = v; });
  return o;
}

async function saveCloud() {
  if (!sb || !sbUser) return;
  const data = snapshotLocal();
  await sb.from("user_data").upsert({ user_id: sbUser.id, data, updated_at: new Date().toISOString() });
}

async function loadCloud() {
  if (!sb || !sbUser) return;
  const { data } = await sb.from("user_data").select("data").eq("user_id", sbUser.id).single();
  if (data && data.data) {
    Object.entries(data.data).forEach(([k, v]) => localStorage.setItem(k, v));
    if (typeof renderRecentlyViewed === "function") renderRecentlyViewed();
    if (typeof renderWatchlist === "function") renderWatchlist();
  }
}

function onSbLogin() { updateSbUI(); loadCloud(); }

function updateSbUI() {
  const btn = document.getElementById("sb-login-btn");
  if (!btn) return;
  if (sbUser) { btn.textContent = sbUser.email.split("@")[0]; btn.onclick = sbSignOut; }
  else { btn.textContent = "Đăng nhập"; btn.onclick = () => sbOpenModal("in"); }
}

document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveCloud(); });
window.addEventListener("beforeunload", () => { if (sbUser) saveCloud(); });
document.addEventListener("DOMContentLoaded", () => { if (initSupabase()) updateSbUI(); });
