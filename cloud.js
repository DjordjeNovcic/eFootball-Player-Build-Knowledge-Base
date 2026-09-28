// Optional cloud sync for the Build Lab: Google sign-in + Firestore.
// Every squad (profile) is one document squads/{id} holding the profile as JSON;
// firestore.rules limits each document to its members. Without an apiKey in
// firebase-config.js this module does nothing and the site stays local-only.
import { FIREBASE_CONFIG, OWNER_UID } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/11.10.0";
const lab = window.BuildLab;
const $ = (s) => document.querySelector(s);
const box = $("#cloudBox");

const JOIN_KEY = "efb-build-lab-join";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ?join=<squadId>~<code> — remember it across the sign-in redirect/popup.
const params = new URLSearchParams(location.search);
if (params.get("join")) {
  try { sessionStorage.setItem(JOIN_KEY, params.get("join")); } catch { /* private mode */ }
  params.delete("join");
  history.replaceState(null, "", `${location.pathname}${params.toString() ? `?${params}` : ""}${location.hash}`);
}
const pendingJoin = () => { try { return sessionStorage.getItem(JOIN_KEY); } catch { return null; } };

if (!lab || !box) {
  // lab.js not loaded — nothing to sync.
} else if (!FIREBASE_CONFIG.apiKey) {
  box.hidden = true;
} else {
  start().catch((err) => {
    console.error("[cloud]", err);
    setStatus("error", "Cloud sync unavailable");
  });
}

let state = { user: null, db: null, fs: null, unsub: null, docs: {}, lastPushed: {}, first: true, pushTimer: null };

function setStatus(kind, text) {
  state.status = { kind, text };
  const el = $("#cloudStatus");
  if (!el) return;
  el.className = `cloud__status is-${kind}`;
  el.textContent = text;
}

function render() {
  const u = state.user;
  const active = lab.activeId();
  const d = state.docs[docIdFor(active)];
  const canInvite = u && active !== "me" && d && d.owner === u.uid;
  box.hidden = false;
  box.innerHTML = u
    ? `${u.photoURL ? `<img class="cloud__avatar" src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">` : ""}
       <span class="cloud__who">${esc(u.displayName || "Signed in")}</span>
       <span class="cloud__status" id="cloudStatus"></span>
       ${canInvite ? `<button type="button" class="btn btn--icon" id="cloudInvite">Invite link</button>` : ""}
       ${d && active !== "me" && d.owner !== u.uid ? `<span class="badge">shared with you</span>` : ""}
       <button type="button" class="btn btn--icon" id="cloudOut">Sign out</button>`
    : `<button type="button" class="btn btn--primary btn--small" id="cloudIn">Sign in with Google</button>
       <span class="cloud__status" id="cloudStatus">${pendingJoin() ? "Sign in to join the shared squad" : "Local only — sign in to sync across devices"}</span>`;
  if (u && state.status) setStatus(state.status.kind, state.status.text);
  $("#cloudIn")?.addEventListener("click", signIn);
  $("#cloudOut")?.addEventListener("click", () => state.auth.signOutFn());
  $("#cloudInvite")?.addEventListener("click", invite);
}

async function start() {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`),
  ]);
  const app = initializeApp(FIREBASE_CONFIG);
  const a = auth.getAuth(app);
  state.fs = fs;
  state.db = fs.getFirestore(app);
  state.auth = {
    signInFn: () => auth.signInWithPopup(a, new auth.GoogleAuthProvider()),
    signOutFn: () => auth.signOut(a),
  };
  lab.onChange(schedulePush);
  lab.onDelete(onLocalDelete);
  render();
  auth.onAuthStateChanged(a, (user) => {
    state.user = user;
    state.unsub?.();
    state.unsub = null;
    state.docs = {};
    state.lastPushed = {};
    state.first = true;
    lab.setRepoSquad(!user || !OWNER_UID || user.uid === OWNER_UID);
    if (user) console.info(`[cloud] signed in — uid ${user.uid}`);
    render();
    if (user) connect();
  });
}

async function signIn() {
  try {
    await state.auth.signInFn();
  } catch (err) {
    if (err?.code !== "auth/popup-closed-by-user") setStatus("error", `Sign-in failed: ${err?.code || err}`);
  }
}

/* ---------- id mapping: local "me" ↔ squads/me_<uid> ---------- */

const docIdFor = (localId) => (localId === "me" ? `me_${state.user?.uid}` : localId);
const localIdFor = (docId) => (docId === `me_${state.user?.uid}` ? "me" : docId);
const profileJson = (p) => JSON.stringify(p);

/* ---------- pull ---------- */

async function connect() {
  const { collection, query, where, onSnapshot } = state.fs;
  await joinIfInvited();
  setStatus("busy", "Syncing…");
  const q = query(collection(state.db, "squads"), where("members", "array-contains", state.user.uid));
  state.unsub = onSnapshot(q, (snap) => {
    if (state.first) {
      state.first = false;
      firstMerge(snap);
    } else {
      snap.docChanges().forEach((ch) => {
        if (ch.doc.metadata.hasPendingWrites) return;
        const id = ch.doc.id;
        if (ch.type === "removed") {
          delete state.docs[id];
          lab.dropProfile(localIdFor(id));
          return;
        }
        const d = ch.doc.data();
        state.docs[id] = d;
        if (d.json !== state.lastPushed[id]) {
          state.lastPushed[id] = d.json;
          lab.putProfile(localIdFor(id), JSON.parse(d.json));
        }
      });
    }
    render();
    setStatus("ok", "Synced");
  }, (err) => {
    console.error("[cloud] listen", err);
    setStatus("error", "Sync error — see console");
  });
}

// First connection on this device: merge what's in the browser with what's in the cloud,
// so nothing made before signing in is lost.
function firstMerge(snap) {
  const root = lab.root();
  const remoteIds = new Set();
  snap.forEach((docSnap) => {
    const id = docSnap.id;
    const d = docSnap.data();
    remoteIds.add(id);
    state.docs[id] = d;
    const lid = localIdFor(id);
    const remote = JSON.parse(d.json);
    const local = root.profiles[lid];
    const merged = local ? mergeProfiles(local, remote) : remote;
    state.lastPushed[id] = profileJson(merged) === d.json ? d.json : null; // null → push merged result
    lab.putProfile(lid, merged);
  });
  Object.keys(root.profiles).forEach((lid) => {
    if (!remoteIds.has(docIdFor(lid))) state.lastPushed[docIdFor(lid)] = null; // new → create
  });
  const join = pendingJoin();
  if (join) {
    try { sessionStorage.removeItem(JOIN_KEY); } catch { /* ignore */ }
    const id = join.split("~")[0];
    if (lab.root().profiles[id]) lab.switchTo(id);
  }
  pushNow();
}

function mergeProfiles(a, b) {
  const newer = (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b;
  const older = newer === a ? b : a;
  const out = { ...older, ...newer };
  ["builds", "positions", "customPlayers"].forEach((k) => { out[k] = { ...(older[k] || {}), ...(newer[k] || {}) }; });
  const lineups = new Map();
  [...(older.lineups || []), ...(newer.lineups || [])].forEach((l) => lineups.set(l.id, l));
  out.lineups = [...lineups.values()];
  out.removed = [...new Set([...(older.removed || []), ...(newer.removed || [])])];
  out.ownedManagers = [...new Set([...(older.ownedManagers || []), ...(newer.ownedManagers || [])])];
  return out;
}

/* ---------- push ---------- */

function schedulePush() {
  if (!state.user || state.first) return;
  clearTimeout(state.pushTimer);
  setStatus("busy", "Saving…");
  state.pushTimer = setTimeout(pushNow, 800);
}

async function pushNow() {
  if (!state.user) return;
  const { doc, setDoc, updateDoc, serverTimestamp } = state.fs;
  const root = lab.root();
  const jobs = Object.entries(root.profiles).map(async ([lid, p]) => {
    const id = docIdFor(lid);
    const json = profileJson(p);
    if (json === state.lastPushed[id]) return;
    const ref = doc(state.db, "squads", id);
    const meta = { name: (lid === "me" ? "My squad" : p.name || "Friend").slice(0, 60), kind: lid === "me" ? "me" : "friend",
      json, updatedAt: serverTimestamp(), updatedBy: state.user.uid };
    if (state.docs[id]) {
      await updateDoc(ref, meta);
    } else {
      const created = { ...meta, owner: state.user.uid, members: [state.user.uid] };
      await setDoc(ref, created);
      state.docs[id] = created;
    }
    state.lastPushed[id] = json;
  });
  try {
    await Promise.all(jobs);
    setStatus("ok", "Synced");
  } catch (err) {
    console.error("[cloud] push", err);
    setStatus("error", `Couldn't save: ${err?.code || err}`);
  }
}

async function onLocalDelete(lid) {
  if (!state.user) return;
  const id = docIdFor(lid);
  const d = state.docs[id];
  if (!d) return;
  const { doc, deleteDoc, updateDoc, arrayRemove } = state.fs;
  try {
    if (d.owner === state.user.uid) await deleteDoc(doc(state.db, "squads", id));
    else await updateDoc(doc(state.db, "squads", id), { members: arrayRemove(state.user.uid) }); // leave
    delete state.docs[id];
    delete state.lastPushed[id];
  } catch (err) {
    console.error("[cloud] delete", err);
  }
}

/* ---------- sharing ---------- */

async function invite() {
  const { doc, updateDoc } = state.fs;
  const id = docIdFor(lab.activeId());
  const d = state.docs[id];
  if (!d) return;
  let code = d.inviteCode;
  if (!code) {
    const bytes = crypto.getRandomValues(new Uint8Array(18));
    code = [...bytes].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 28);
    await updateDoc(doc(state.db, "squads", id), { inviteCode: code });
    d.inviteCode = code;
  }
  const link = `${location.origin}${location.pathname}?join=${encodeURIComponent(`${id}~${code}`)}`;
  try {
    await navigator.clipboard.writeText(link);
    setStatus("ok", "Invite link copied — send it to your friend");
  } catch {
    window.prompt("Send this link to your friend:", link);
  }
}

async function joinIfInvited() {
  const join = pendingJoin();
  if (!join) return;
  const [id, code] = join.split("~");
  if (!id || !code) return;
  const { doc, updateDoc, arrayUnion } = state.fs;
  try {
    await updateDoc(doc(state.db, "squads", id), { members: arrayUnion(state.user.uid), joinCode: code });
  } catch (err) {
    // Already a member (rules reject a no-op join) or a bad/expired link.
    if (err?.code !== "permission-denied") console.error("[cloud] join", err);
  }
}
