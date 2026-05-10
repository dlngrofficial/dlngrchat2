
    
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTBijtaD2itFaHPYYAnFm8XdzQjC-r9EU",
  authDomain: "screenshare-5ce9d.firebaseapp.com",
  databaseURL: "https://screenshare-5ce9d-default-rtdb.firebaseio.com",
  projectId: "screenshare-5ce9d",
  storageBucket: "screenshare-5ce9d.firebasestorage.app",
  messagingSenderId: "293849844955",
  appId: "1:293849844955:web:8149bc48ba4f54527fd0fe",
  measurementId: "G-1PLJSM7QFM"
};

const NAME_RULES = [
  { match: "includes", value: "udit", password: "dlngr1" },
  { match: "includes", value: "dlngr", password: "dlngr1" },
  { match: "exact", value: "supergaming94", password: "dlngr1", tagKey: "admin" }
];

const USER_TAGS = [
  { key: "creator", label: "Creator", names: ["udit"], badgeClass: "tag-badge--creator", messageClass: "message--creator" },
  { key: "admin", label: "Admin", names: ["supergaming94"], badgeClass: "tag-badge--admin", messageClass: "message--admin" }
];

const MEDIA_SHORTCUTS = {
  "/67": { type: "yt", url: "https://www.youtube.com/watch?v=Jeu66nEnwqMw" }
};

const STORAGE_KEYS = {
  username: "dlngrchat_username",
  draft: "dlngrchat_draft",
  sessionId: "dlngrchat_session_id",
  seenMentions: "dlngrchat_seen_mentions",
  handledLogoutAll: "dlngrchat_handled_logout_all",
  handledBroadcast: "dlngrchat_handled_broadcast"
};

const ROOM_NAME = "main-room";
const MAX_MESSAGES = 120;
const PRESENCE_TTL_MS = 45000;
const PRESENCE_REFRESH_MS = 15000;

const joinPanel = document.getElementById("joinPanel");
const chatPanel = document.getElementById("chatPanel");
const joinForm = document.getElementById("joinForm");
const messageForm = document.getElementById("messageForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("roomPassword");
const passwordWrap = document.getElementById("passwordWrap");
const messageInput = document.getElementById("messageInput");
const joinStatus = document.getElementById("joinStatus");
const activeUsername = document.getElementById("activeUsername");
const activeUserTag = document.getElementById("activeUserTag");
const mobileActiveUsername = document.getElementById("mobileActiveUsername");
const mobileActiveUserTag = document.getElementById("mobileActiveUserTag");
const onlineUsers = document.getElementById("onlineUsers");
const onlineCount = document.getElementById("onlineCount");
const mobileOnlineUsers = document.getElementById("mobileOnlineUsers");
const mobileOnlineCount = document.getElementById("mobileOnlineCount");
const messagesContainer = document.getElementById("messages");
const messageTemplate = document.getElementById("messageTemplate");
const changeNameBtn = document.getElementById("changeNameBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const logoutBtn = document.getElementById("logoutBtn");
const problemBtn = document.getElementById("problemBtn");
const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
const mobileOverlay = document.getElementById("mobileOverlay");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const editCancelBtn = document.getElementById("editCancelBtn");
const mediaPanel = document.getElementById("mediaPanel");
const mediaPanelBody = document.getElementById("mediaPanelBody");
const mediaCloseBtn = document.getElementById("mediaCloseBtn");
const mobileMediaToggle = document.getElementById("mobileMediaToggle");
const mobileMedia = document.getElementById("mobileMedia");
const mobileMediaBody = document.getElementById("mobileMediaBody");
const mobileMediaCloseBtn = document.getElementById("mobileMediaCloseBtn");
const mobileDrawer = document.getElementById("mobileDrawer");
const mobileDrawerCloseBtn = document.getElementById("mobileDrawerCloseBtn");
const mobileChangeNameBtn = document.getElementById("mobileChangeNameBtn");
const mobileClearChatBtn = document.getElementById("mobileClearChatBtn");
const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
const mobileProblemBtn = document.getElementById("mobileProblemBtn");
const desktopBellToggle = document.getElementById("desktopBellToggle");
const desktopBellBadge = document.getElementById("desktopBellBadge");
const mobileBellToggle = document.getElementById("mobileBellToggle");
const mobileBellBadge = document.getElementById("mobileBellBadge");
const desktopPinToggle = document.getElementById("desktopPinToggle");
const desktopPinBadge = document.getElementById("desktopPinBadge");
const mobilePinToggle = document.getElementById("mobilePinToggle");
const mobilePinBadge = document.getElementById("mobilePinBadge");
const globalAlertToggle = document.getElementById("globalAlertToggle");
const globalAlertBadge = document.getElementById("globalAlertBadge");
const mobileGlobalAlertToggle = document.getElementById("mobileGlobalAlertToggle");
const mobileGlobalAlertBadge = document.getElementById("mobileGlobalAlertBadge");
const pinPanel = document.getElementById("pinPanel");
const pinPanelBody = document.getElementById("pinPanelBody");
const pinPanelCloseBtn = document.getElementById("pinPanelCloseBtn");
const notificationPanel = document.getElementById("notificationPanel");
const notificationList = document.getElementById("notificationList");
const notificationCloseBtn = document.getElementById("notificationCloseBtn");
const alertPanel = document.getElementById("alertPanel");
const alertPanelBody = document.getElementById("alertPanelBody");
const alertPanelCloseBtn = document.getElementById("alertPanelCloseBtn");
const broadcastToast = document.getElementById("broadcastToast");
const broadcastToastText = document.getElementById("broadcastToastText");
const problemModal = document.getElementById("problemModal");
const problemCloseBtn = document.getElementById("problemCloseBtn");
const problemForm = document.getElementById("problemForm");
const problemSubjectInput = document.getElementById("problemSubject");
const problemMessageInput = document.getElementById("problemMessage");
const problemStatus = document.getElementById("problemStatus");

let currentUser = "";
let messages = [];
let onlineSessions = [];
let db = null;
let messagesRef = null;
let presenceRef = null;
let sharedMediaRef = null;
let controlRef = null;
let pinnedRef = null;
let creatorInboxRef = null;
let siteNotificationsRef = null;
let unsubscribeMessages = null;
let unsubscribePresence = null;
let unsubscribeMedia = null;
let unsubscribeControl = null;
let unsubscribePinned = null;
let unsubscribeSiteNotifications = null;
let firebaseReady = false;
let presenceHeartbeat = null;
let presencePruneTimer = null;
let currentPresenceId = null;
let sharedMediaState = null;
let pinnedMessages = [];
let activeBroadcast = null;
let siteNotifications = [];
let lastDirectMentionCount = 0;
let seenMentions = new Set();
let broadcastToastTimer = null;
let broadcastExpiryTimer = null;
let editingMessageId = null;

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => value && !String(value).startsWith("PASTE_YOUR_"));
}
function normalizeName(name) { return (name || "").trim().replace(/\s+/g, " ").slice(0, 24); }
function normalizeNameKey(name) { return normalizeName(name).toLowerCase(); }
function formatTime(timestamp) {
  return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}
function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function autoResizeTextarea() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${messageInput.scrollHeight}px`;
}
function updateSendButtonState() { sendMessageBtn.disabled = !messageInput.value.trim(); }
function updateEditStateUI() {
  editCancelBtn.classList.toggle("hidden", !editingMessageId);
  messageInput.placeholder = editingMessageId ? "Editing message..." : "Transmit message...";
}
function setJoinStatus(message, isError = false) {
  joinStatus.textContent = message;
  joinStatus.style.color = isError ? "var(--warning)" : "";
}
function getMatchedRule(name) {
  const key = normalizeNameKey(name);
  return NAME_RULES.find((rule) => {
    const value = normalizeNameKey(rule.value);
    return rule.match === "exact" ? key === value : key.includes(value);
  }) || null;
}
function getRequiredPassword(name) { return getMatchedRule(name)?.password || null; }
function getTagDefinition(name) {
  const key = normalizeNameKey(name);
  const ruleTagKey = getMatchedRule(name)?.tagKey;
  if (ruleTagKey) return USER_TAGS.find((tag) => tag.key === ruleTagKey) || null;
  if (key.includes("udit")) return USER_TAGS.find((tag) => tag.key === "creator") || null;
  return USER_TAGS.find((tag) => tag.names.some((tagName) => normalizeNameKey(tagName) === key)) || null;
}
function isElevatedUser(name = currentUser) {
  const tag = getTagDefinition(name);
  return tag?.key === "creator" || tag?.key === "admin";
}
function isCreatorUser(name = currentUser) { return getTagDefinition(name)?.key === "creator"; }
function getLiveUsers() {
  return onlineSessions
    .filter((user) => Date.now() - user.lastSeen < PRESENCE_TTL_MS)
    .sort((l, r) => l.name.localeCompare(r.name));
}
function getOnlineMentionTargets() {
  const targets = new Set();
  getLiveUsers().forEach((user) => {
    const key = normalizeNameKey(user.name);
    if (key) targets.add(key);
  });
  return [...targets];
}
function buildMentionMeta(text) {
  const mentionAll = /(^|\s)@everyone(?=\b|\s|$)/i.test(text || "");
  return {
    mentionAll,
    mentionAllFor: mentionAll ? getOnlineMentionTargets() : []
  };
}
function messageMentionsCurrentUser(messageOrText) {
  const nameKey = normalizeNameKey(currentUser);
  if (!nameKey) return false;
  const message = typeof messageOrText === "string" ? { text: messageOrText } : (messageOrText || {});
  const text = message.text || "";
  const mentionRegex = new RegExp(`(^|\\s)@${nameKey}(?=\\b|\\s|$)`, "i");
  if (mentionRegex.test(text)) return true;
  return Array.isArray(message.mentionAllFor) && message.mentionAllFor.includes(nameKey);
}
function hasOnlyEveryoneMention(message) {
  if (!message?.mentionAll) return false;
  const withoutEveryone = (message.text || "").replace(/@everyone/ig, "");
  return !/@[a-z0-9_]+/i.test(withoutEveryone);
}
function applyTagBadge(element, tagDefinition) {
  element.className = "tag-badge";
  if (!tagDefinition) { element.textContent = ""; element.classList.add("hidden"); return; }
  element.textContent = tagDefinition.label;
  element.classList.remove("hidden");
  if (tagDefinition.badgeClass) element.classList.add(tagDefinition.badgeClass);
}
function updatePasswordPrompt() {
  const requiredPassword = getRequiredPassword(usernameInput.value);
  passwordWrap.classList.toggle("hidden", !requiredPassword);
  passwordInput.required = Boolean(requiredPassword);
  if (!requiredPassword) passwordInput.value = "";
}
function closeNotifications() { notificationPanel.classList.add("hidden"); }
function toggleNotifications() {
  closePinPanel();
  closeAlertPanel();
  notificationPanel.classList.toggle("hidden");
}
function closePinPanel() { pinPanel.classList.add("hidden"); }
function togglePinPanel() {
  if (!pinnedMessages.length) return;
  closeNotifications();
  closeAlertPanel();
  pinPanel.classList.toggle("hidden");
}
function closeAlertPanel() { alertPanel.classList.add("hidden"); }
function toggleAlertPanel() {
  closeNotifications();
  closePinPanel();
  alertPanel.classList.toggle("hidden");
}
function openProblemModal() {
  problemModal.classList.remove("hidden");
  problemModal.setAttribute("aria-hidden", "false");
  problemStatus.textContent = "";
  setTimeout(() => problemSubjectInput.focus(), 30);
}
function closeProblemModal() {
  problemModal.classList.add("hidden");
  problemModal.setAttribute("aria-hidden", "true");
}
function scrollToMessage(messageId) {
  const target = messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("message--mention-flash");
  window.setTimeout(() => target.classList.remove("message--mention-flash"), 2200);
}
function showBroadcastToast(text) {
  if (!text) return;
  broadcastToastText.textContent = text;
  broadcastToast.classList.remove("hidden");
  if (broadcastToastTimer) window.clearTimeout(broadcastToastTimer);
  broadcastToastTimer = window.setTimeout(() => {
    broadcastToast.classList.add("hidden");
  }, 5000);
}
function scheduleBroadcastExpiryRender() {
  if (broadcastExpiryTimer) window.clearTimeout(broadcastExpiryTimer);
  if (!activeBroadcast?.expiresAt) return;
  const delay = activeBroadcast.expiresAt - Date.now();
  if (delay <= 0) return;
  broadcastExpiryTimer = window.setTimeout(() => renderBroadcastState(), delay + 120);
}
function renderPinnedState() {
  const hasPinned = pinnedMessages.length > 0;
  const badgeText = pinnedMessages.length > 99 ? "99+" : String(pinnedMessages.length);
  desktopPinBadge.textContent = badgeText;
  mobilePinBadge.textContent = badgeText;
  desktopPinBadge.classList.toggle("hidden", !hasPinned);
  mobilePinBadge.classList.toggle("hidden", !hasPinned);
  if (!hasPinned) {
    pinPanelBody.innerHTML = "<p class='empty-users'>No pinned message yet.</p>";
    return;
  }
  pinPanelBody.innerHTML = "";
  pinnedMessages.forEach((item) => {
    const card = document.createElement("div");
    card.className = "pinned-preview";
    card.innerHTML = `
      <div class="pinned-preview__top">
        <strong>${escapeHtml(item.author || "Unknown")}</strong>
        <span class="pinned-preview__meta">Pinned by ${escapeHtml(item.pinnedBy || "Creator")} • ${formatTime(item.pinnedAt || Date.now())}</span>
      </div>
      <p class="pinned-preview__text">${escapeHtml(item.text).replaceAll("\n", "<br>")}</p>
      <div class="pinned-preview__actions">
        <button type="button" class="mini-action-btn" data-pin-jump="${escapeHtml(item.messageId)}">Jump To Message</button>
        ${isCreatorUser() ? `<button type="button" class="mini-action-btn" data-pin-remove="${escapeHtml(item.messageId)}">Unpin</button>` : ""}
      </div>
    `;
    pinPanelBody.appendChild(card);
  });
  pinPanelBody.querySelectorAll("[data-pin-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      closePinPanel();
      scrollToMessage(button.getAttribute("data-pin-jump"));
    });
  });
  pinPanelBody.querySelectorAll("[data-pin-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      clearPinnedMessage(button.getAttribute("data-pin-remove")).catch(() => { setJoinStatus("Could not clear pinned message.", true); });
    });
  });
}
function renderBroadcastState() {
  const isActive = Boolean(activeBroadcast?.text) && Number(activeBroadcast.expiresAt || 0) > Date.now();
  if (!isActive) {
    broadcastToast.classList.add("hidden");
    return;
  }
  scheduleBroadcastExpiryRender();
}
function maybeShowActiveBroadcast() {
  const handled = localStorage.getItem(STORAGE_KEYS.handledBroadcast) || "";
  const isActive = Boolean(activeBroadcast?.text) && Number(activeBroadcast.expiresAt || 0) > Date.now();
  if (!isActive || !currentUser || handled === activeBroadcast.id) return;
  localStorage.setItem(STORAGE_KEYS.handledBroadcast, activeBroadcast.id);
  showBroadcastToast(activeBroadcast.text);
}
function renderSiteNotifications() {
  const count = siteNotifications.length;
  globalAlertBadge.textContent = count > 99 ? "99+" : String(count);
  mobileGlobalAlertBadge.textContent = count > 99 ? "99+" : String(count);
  globalAlertBadge.classList.toggle("hidden", count === 0);
  mobileGlobalAlertBadge.classList.toggle("hidden", count === 0);
  if (count === 0) {
    alertPanelBody.innerHTML = "<p class='empty-users'>No site notifications yet.</p>";
    return;
  }
  alertPanelBody.innerHTML = "";
  siteNotifications.forEach((item) => {
    const card = document.createElement("article");
    card.className = "site-notification-item";
    card.innerHTML = `
      <div class="site-notification-item__top">
        <strong class="site-notification-item__title">${escapeHtml(item.title || "Notification")}</strong>
        <span class="site-notification-item__meta">${escapeHtml(item.senderName || "DLNGR Creator")} • ${formatTime(item.createdAt || Date.now())}</span>
      </div>
      <p class="site-notification-item__body">${escapeHtml(item.body || "").replaceAll("\n", "<br>")}</p>
    `;
    alertPanelBody.appendChild(card);
  });
}
function cancelEditingMessage(statusMessage = "Message edit cancelled.") {
  editingMessageId = null;
  messageInput.value = "";
  localStorage.removeItem(STORAGE_KEYS.draft);
  autoResizeTextarea();
  updateSendButtonState();
  updateEditStateUI();
  if (statusMessage) setJoinStatus(statusMessage);
}
function startEditingMessage(message) {
  editingMessageId = message.id;
  messageInput.value = message.text;
  localStorage.setItem(STORAGE_KEYS.draft, messageInput.value);
  autoResizeTextarea();
  updateSendButtonState();
  updateEditStateUI();
  messageInput.focus();
  messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
  setJoinStatus("Editing message. Press Enter to save or Esc to cancel.");
}
function getLatestEditableMessage() {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (canEditMessage(message)) return message;
  }
  return null;
}

function renderNotifications() {
  const mentionMessages = messages.filter((m) => m.type === "user" && m.author !== currentUser && messageMentionsCurrentUser(m));
  const unseenMentions = mentionMessages.filter((m) => !seenMentions.has(m.id));
  const unseenDirectMentions = unseenMentions.filter((message) => !hasOnlyEveryoneMention(message));
  const count = unseenMentions.length;
  const countText = String(count);
  desktopBellBadge.textContent = countText;
  mobileBellBadge.textContent = countText;
  desktopBellBadge.classList.toggle("hidden", count === 0);
  mobileBellBadge.classList.toggle("hidden", count === 0);
  if (count === 0) {
    notificationList.innerHTML = "<p class='empty-users'>No mentions yet.</p>";
    lastDirectMentionCount = 0;
    return;
  }
  if (unseenDirectMentions.length > lastDirectMentionCount) notificationPanel.classList.remove("hidden");
  lastDirectMentionCount = unseenDirectMentions.length;
  notificationList.innerHTML = "";
  mentionMessages.slice().reverse().forEach((message) => {
    const button = document.createElement("button");
    const meta = document.createElement("span");
    const text = document.createElement("span");
    button.type = "button";
    button.className = "notification-item";
    meta.className = "notification-item__meta";
    text.className = "notification-item__text";
    meta.textContent = `${message.author} • ${formatTime(message.timestamp || Date.now())}`;
    text.textContent = message.text;
    button.append(meta, text);
    button.addEventListener("click", () => {
      seenMentions.add(message.id);
      localStorage.setItem(STORAGE_KEYS.seenMentions, JSON.stringify([...seenMentions]));
      closeNotifications();
      renderNotifications();
      scrollToMessage(message.id);
    });
    notificationList.appendChild(button);
  });
}

function normalizeWebsiteUrl(url) {
  if (!url) return "";
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
function toYouTubeEmbed(url) {
  try {
    const parsed = new URL(normalizeWebsiteUrl(url));
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replaceAll("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch { return ""; }
  return "";
}
function resolveMediaUrl(type, url) {
  return type === "yt" ? toYouTubeEmbed(url) : normalizeWebsiteUrl(url);
}
function clearNode(node) { node.innerHTML = ""; }
function buildMediaFrame(target, mediaState) {
  clearNode(target);
  if (!mediaState?.url) return;
  const frame = document.createElement("iframe");
  frame.className = "media-frame";
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.allowFullscreen = true;
  frame.src = mediaState.url;
  target.appendChild(frame);
}
function closeMobileMedia() { mobileMedia.classList.add("hidden"); }
function renderSharedMedia() {
  const hasMedia = Boolean(sharedMediaState?.url);
  const fullForViewers = Boolean(sharedMediaState?.fullForViewers);
  const creatorView = isCreatorUser();
  mediaPanel.classList.toggle("hidden", !hasMedia);
  mobileMediaToggle.classList.toggle("hidden", !hasMedia);
  mobileMediaToggle.classList.toggle("mobile-media-toggle--alert", hasMedia);
  chatPanel.classList.toggle("chat-panel--with-media", hasMedia);
  chatPanel.classList.toggle("media-full-viewer", hasMedia && fullForViewers && !creatorView && window.innerWidth > 760);
  if (!hasMedia) { clearNode(mediaPanelBody); clearNode(mobileMediaBody); closeMobileMedia(); return; }
  buildMediaFrame(mediaPanelBody, sharedMediaState);
  buildMediaFrame(mobileMediaBody, sharedMediaState);
}
async function updateSharedMedia(nextState) {
  if (!sharedMediaRef) return;
  await setDoc(sharedMediaRef, { ...nextState, updatedAt: serverTimestamp() });
}
async function forceLogoutAll() {
  if (!controlRef) return;
  await setDoc(controlRef, { logoutAllAt: Date.now(), updatedAt: serverTimestamp() }, { merge: true });
}
async function sendCreatorBroadcast(text) {
  if (!controlRef || !isCreatorUser()) return;
  await setDoc(controlRef, {
    broadcast: {
      id: crypto.randomUUID(),
      text,
      createdBy: currentUser,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5000
    },
    updatedAt: serverTimestamp()
  }, { merge: true });
}
async function performLocalLogout(message = "Connection terminated.") {
  await stopPresence();
  currentUser = "";
  localStorage.removeItem(STORAGE_KEYS.username);
  localStorage.removeItem(STORAGE_KEYS.draft);
  localStorage.removeItem(STORAGE_KEYS.sessionId);
  editingMessageId = null;
  messageInput.value = "";
  passwordInput.value = "";
  usernameInput.value = "";
  clearChatBtn.classList.add("hidden");
  mobileClearChatBtn.classList.add("hidden");
  setChatView(false);
  closeProblemModal();
  updatePasswordPrompt();
  autoResizeTextarea();
  updateSendButtonState();
  setJoinStatus(message);
}
async function closeSharedMedia() {
  if (!isCreatorUser() || !sharedMediaRef) return;
  await setDoc(sharedMediaRef, { type: "", url: "", fullForViewers: false, updatedAt: serverTimestamp() });
}
function parseCreatorCommand(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return null;
  const [command, ...rest] = trimmed.split(/\s+/);
  const argument = rest.join(" ").trim();
  if (MEDIA_SHORTCUTS[command]) {
    return { kind: "media", type: MEDIA_SHORTCUTS[command].type, url: resolveMediaUrl(MEDIA_SHORTCUTS[command].type, MEDIA_SHORTCUTS[command].url) };
  }
  if (command === "/website") {
    if (argument.toLowerCase() === "close") return { kind: "close" };
    return { kind: "media", type: "website", url: resolveMediaUrl("website", argument) };
  }
  if (command === "/yt") {
    if (argument.toLowerCase() === "close") return { kind: "close" };
    return { kind: "media", type: "yt", url: resolveMediaUrl("yt", argument) };
  }
  if (command === "/full") return { kind: "full", enabled: argument.toLowerCase() !== "close" };
  if (command === "/logoutall") return { kind: "logoutall" };
  if (command === "/notify") return { kind: "notify", text: argument };
  return null;
}
async function handleCreatorCommand(text) {
  const command = parseCreatorCommand(text);
  if (!command) return false;
  if (command.kind === "close") { await closeSharedMedia(); setJoinStatus("Feed closed."); return true; }
  if (command.kind === "full") {
    if (!sharedMediaState?.url) { setJoinStatus("Open a feed first before using /full.", true); return true; }
    await updateSharedMedia({ ...sharedMediaState, fullForViewers: command.enabled });
    setJoinStatus(command.enabled ? "Feed is now full view." : "Feed returned to side view.");
    return true;
  }
  if (command.kind === "logoutall") { await forceLogoutAll(); return true; }
  if (command.kind === "notify") {
    if (!command.text) { setJoinStatus("Use /notify followed by your alert text.", true); return true; }
    await sendCreatorBroadcast(command.text);
    setJoinStatus("Creator notification sent.");
    return true;
  }
  if (!command.url) { setJoinStatus("That command needs a valid URL.", true); return true; }
  await updateSharedMedia({ type: command.type, url: command.url, fullForViewers: false });
  setJoinStatus("Feed opened.");
  return true;
}
function setChatView(enabled) {
  joinPanel.classList.toggle("hidden", enabled);
  chatPanel.classList.toggle("hidden", !enabled);
  chatPanel.classList.remove("is-sidebar-open");
  mobileOverlay.classList.add("hidden");
  mobileDrawer.classList.add("hidden");
  closeNotifications();
  closePinPanel();
  closeAlertPanel();
  if (enabled) {
    activeUsername.textContent = currentUser;
    mobileActiveUsername.textContent = currentUser;
    applyTagBadge(activeUserTag, getTagDefinition(currentUser));
    applyTagBadge(mobileActiveUserTag, getTagDefinition(currentUser));
    updateSendButtonState();
    renderSharedMedia();
    renderPinnedState();
    renderBroadcastState();
    maybeShowActiveBroadcast();
    setTimeout(() => messageInput.focus(), 30);
  } else {
    setTimeout(() => usernameInput.focus(), 30);
  }
}
function persistUser(name) {
  currentUser = name;
  localStorage.setItem(STORAGE_KEYS.username, name);
  activeUsername.textContent = name;
  mobileActiveUsername.textContent = name;
  applyTagBadge(activeUserTag, getTagDefinition(name));
  applyTagBadge(mobileActiveUserTag, getTagDefinition(name));
  clearChatBtn.classList.toggle("hidden", !isElevatedUser(name));
  mobileClearChatBtn.classList.toggle("hidden", !isElevatedUser(name));
}
async function addMessage(message) {
  if (!firebaseReady || !messagesRef) throw new Error("Firebase not ready.");
  const mentionMeta = buildMentionMeta(message.text);
  return addDoc(messagesRef, {
    author: message.author,
    text: message.text,
    type: message.type,
    tagKey: message.tagKey || null,
    ownerSessionId: message.ownerSessionId || currentPresenceId || null,
    mentionAll: mentionMeta.mentionAll,
    mentionAllFor: mentionMeta.mentionAllFor,
    editedAt: null,
    createdAt: serverTimestamp()
  });
}
function canDeleteMessage(message) {
  if (message.type === "system") return false;
  if (isElevatedUser()) return true;
  return Boolean(currentPresenceId && message.ownerSessionId === currentPresenceId);
}
function canEditMessage(message) {
  if (message.type !== "user") return false;
  if (isElevatedUser()) return true;
  return Boolean(currentPresenceId && message.ownerSessionId === currentPresenceId);
}
function canPinMessage(message) {
  return isCreatorUser() && message.type === "user";
}
async function copyMessageText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const previous = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => { button.textContent = previous; }, 1200);
  } catch { setJoinStatus("Copy failed.", true); }
}
async function deleteMessageById(id) {
  if (!messagesRef || !id) return;
  try { await deleteDoc(doc(db, "rooms", ROOM_NAME, "messages", id)); }
  catch { setJoinStatus("Could not delete that message.", true); }
}
async function saveEditedMessage(id, nextText) {
  if (!messagesRef || !id || !nextText) return;
  const mentionMeta = buildMentionMeta(nextText);
  await setDoc(doc(db, "rooms", ROOM_NAME, "messages", id), {
    text: nextText,
    mentionAll: mentionMeta.mentionAll,
    mentionAllFor: mentionMeta.mentionAllFor,
    editedAt: serverTimestamp()
  }, { merge: true });
}
async function pinMessageById(message) {
  if (!pinnedRef || !canPinMessage(message)) return;
  const nextPins = [
    ...pinnedMessages.filter((item) => item.messageId !== message.id),
    {
      messageId: message.id,
      text: message.text,
      author: message.author,
      pinnedBy: currentUser,
      pinnedAt: Date.now()
    }
  ];
  await setDoc(pinnedRef, {
    items: nextPins,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
async function clearPinnedMessage(messageId) {
  if (!pinnedRef || !isCreatorUser()) return;
  const nextPins = messageId
    ? pinnedMessages.filter((item) => item.messageId !== messageId)
    : [];
  await setDoc(pinnedRef, {
    items: nextPins,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
function renderMessageText(message) {
  const editedSuffix = Number(message.editedAt || 0) > 0 ? " <span class=\"message__edited\">(edited)</span>" : "";
  return `${escapeHtml(message.text).replaceAll("\n", "<br>")}${editedSuffix}`;
}
function renderMessages() {
  messagesContainer.innerHTML = "";
  if (messages.length === 0) {
    const emptyState = document.createElement("article");
    emptyState.className = "message message--system";
    emptyState.innerHTML = "<p class='message__text'>// Channel is empty. Transmit first message.</p>";
    messagesContainer.appendChild(emptyState);
    return;
  }
  messages.forEach((message) => {
    const fragment = messageTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".message");
    const author = fragment.querySelector(".message__author");
    const time = fragment.querySelector(".message__time");
    const text = fragment.querySelector(".message__text");
    const tagBadge = fragment.querySelector(".message__tag");
    const copyButton = fragment.querySelector(".message__copy");
    const editButton = fragment.querySelector(".message__edit");
    const pinButton = fragment.querySelector(".message__pin");
    const deleteButton = fragment.querySelector(".message__delete");
    const tagDefinition = USER_TAGS.find((tag) => tag.key === message.tagKey) || getTagDefinition(message.author);
    const hasMention = messageMentionsCurrentUser(message);
    author.textContent = message.author;
    time.textContent = formatTime(message.timestamp || Date.now());
    text.innerHTML = renderMessageText(message);
    applyTagBadge(tagBadge, tagDefinition);
    copyButton.addEventListener("click", () => copyMessageText(message.text, copyButton));
    card.dataset.messageId = message.id;
    if (message.type === "system") card.classList.add("message--system");
    else if (message.author === currentUser) card.classList.add("message--self");
    if (hasMention) card.classList.add("message--mention");
    const isPinned = pinnedMessages.some((item) => item.messageId === message.id);
    if (isPinned) card.classList.add("message--pinned");
    if (tagDefinition?.messageClass) card.classList.add("message--tagged", tagDefinition.messageClass);
    if (canEditMessage(message)) {
      editButton.classList.remove("hidden");
      editButton.addEventListener("click", () => startEditingMessage(message));
    }
    if (canPinMessage(message)) {
      pinButton.classList.remove("hidden");
      pinButton.textContent = isPinned ? "Pinned" : "Pin";
      pinButton.addEventListener("click", () => {
        pinMessageById(message).catch(() => { setJoinStatus("Could not pin that message.", true); });
      });
    }
    if (canDeleteMessage(message)) {
      deleteButton.classList.remove("hidden");
      deleteButton.addEventListener("click", () => deleteMessageById(message.id));
    }
    messagesContainer.appendChild(fragment);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  renderNotifications();
}
function renderUserList(target, users) {
  target.innerHTML = "";
  if (users.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-users";
    emptyState.textContent = "// No nodes online.";
    target.appendChild(emptyState);
    return;
  }
  users.forEach((user) => {
    const tagDefinition = USER_TAGS.find((tag) => tag.key === user.tagKey) || getTagDefinition(user.name);
    const card = document.createElement("article");
    const main = document.createElement("div");
    const dot = document.createElement("span");
    const name = document.createElement("strong");
    const badge = document.createElement("span");
    card.className = "user-card";
    main.className = "user-card__main";
    dot.className = "user-dot";
    name.className = "user-name";
    name.textContent = user.sessionId === currentPresenceId ? `${user.name} (You)` : user.name;
    applyTagBadge(badge, tagDefinition);
    main.append(dot, name);
    card.append(main);
    if (!badge.classList.contains("hidden")) card.append(badge);
    target.appendChild(card);
  });
}
function renderOnlineUsers() {
  const liveUsers = getLiveUsers();
  const countText = `${liveUsers.length} node${liveUsers.length === 1 ? "" : "s"} online`;
  onlineCount.textContent = countText;
  mobileOnlineCount.textContent = countText;
  renderUserList(onlineUsers, liveUsers);
  renderUserList(mobileOnlineUsers, liveUsers);
}
function setupFirebase() {
  if (!hasFirebaseConfig()) { setJoinStatus("Add Firebase keys before using live chat.", true); return; }
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  messagesRef = collection(db, "rooms", ROOM_NAME, "messages");
  presenceRef = collection(db, "rooms", ROOM_NAME, "presence");
  sharedMediaRef = doc(db, "rooms", ROOM_NAME, "shared", "media");
  controlRef = doc(db, "rooms", ROOM_NAME, "shared", "control");
  pinnedRef = doc(db, "rooms", ROOM_NAME, "shared", "pinned");
  creatorInboxRef = collection(db, "creatorInbox");
  siteNotificationsRef = collection(db, "siteNotifications");
  firebaseReady = true;
  subscribeToMessages();
  subscribeToPresence();
  subscribeToSharedMedia();
  subscribeToControls();
  subscribeToPinnedMessage();
  subscribeToSiteNotifications();
}
function subscribeToMessages() {
  if (!firebaseReady || !messagesRef) return;
  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"), limit(MAX_MESSAGES));
  unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
    messages = snapshot.docs.map((snapshotDoc) => {
      const data = snapshotDoc.data();
      return {
        id: snapshotDoc.id,
        author: data.author || "Unknown",
        text: data.text || "",
        type: data.type || "user",
        tagKey: data.tagKey || null,
        ownerSessionId: data.ownerSessionId || null,
        mentionAll: Boolean(data.mentionAll),
        mentionAllFor: Array.isArray(data.mentionAllFor) ? data.mentionAllFor : [],
        timestamp: data.createdAt?.toMillis?.() || Date.now(),
        editedAt: data.editedAt?.toMillis?.() || 0
      };
    });
    renderMessages();
  });
}
function subscribeToPresence() {
  if (!firebaseReady || !presenceRef) return;
  unsubscribePresence = onSnapshot(presenceRef, (snapshot) => {
    onlineSessions = snapshot.docs.map((snapshotDoc) => {
      const data = snapshotDoc.data();
      return { sessionId: snapshotDoc.id, name: data.name || "Guest", tagKey: data.tagKey || null, lastSeen: data.updatedAt?.toMillis?.() || 0 };
    });
    renderOnlineUsers();
  });
  presencePruneTimer = window.setInterval(renderOnlineUsers, 10000);
}
function subscribeToSharedMedia() {
  if (!firebaseReady || !sharedMediaRef) return;
  unsubscribeMedia = onSnapshot(sharedMediaRef, (snapshot) => {
    const data = snapshot.data();
    sharedMediaState = data?.url ? { type: data.type || "website", url: data.url || "", fullForViewers: Boolean(data.fullForViewers) } : null;
    renderSharedMedia();
  });
}
function subscribeToControls() {
  if (!firebaseReady || !controlRef) return;
  unsubscribeControl = onSnapshot(controlRef, (snapshot) => {
    const data = snapshot.data();
    const logoutAllAt = Number(data?.logoutAllAt || 0);
    const handled = Number(localStorage.getItem(STORAGE_KEYS.handledLogoutAll) || 0);
    if (logoutAllAt && logoutAllAt > handled && currentUser) {
      localStorage.setItem(STORAGE_KEYS.handledLogoutAll, String(logoutAllAt));
      performLocalLogout("Creator terminated all sessions.").catch(() => {});
    }
    const broadcast = data?.broadcast || null;
    activeBroadcast = broadcast?.text ? {
      id: broadcast.id || "",
      text: broadcast.text || "",
      expiresAt: Number(broadcast.expiresAt || 0)
    } : null;
    renderBroadcastState();
    maybeShowActiveBroadcast();
  });
}
function subscribeToPinnedMessage() {
  if (!firebaseReady || !pinnedRef) return;
  unsubscribePinned = onSnapshot(pinnedRef, (snapshot) => {
    const data = snapshot.data();
    pinnedMessages = Array.isArray(data?.items)
      ? data.items.map((item) => ({
          messageId: item.messageId || "",
          text: item.text || "",
          author: item.author || "",
          pinnedBy: item.pinnedBy || "Creator",
          pinnedAt: Number(item.pinnedAt || 0)
        }))
      : (data?.text ? [{
          messageId: data.messageId || "",
          text: data.text || "",
          author: data.author || "",
          pinnedBy: data.pinnedBy || "Creator",
          pinnedAt: Number(data.pinnedAt || 0)
        }] : []);
    renderPinnedState();
    renderMessages();
  });
}
function subscribeToSiteNotifications() {
  if (!firebaseReady || !siteNotificationsRef) return;
  const notificationQuery = query(siteNotificationsRef, orderBy("createdAt", "desc"), limit(30));
  unsubscribeSiteNotifications = onSnapshot(notificationQuery, (snapshot) => {
    siteNotifications = snapshot.docs.map((snapshotDoc) => {
      const data = snapshotDoc.data();
      return {
        id: snapshotDoc.id,
        title: data.title || "Notification",
        body: data.body || "",
        senderName: data.senderName || "DLNGR Creator",
        createdAt: data.createdAt?.toMillis?.() || Date.now()
      };
    });
    renderSiteNotifications();
  }, () => {
    siteNotifications = [];
    renderSiteNotifications();
  });
}
async function startPresence(name) {
  if (!presenceRef) return;
  const tagDefinition = getTagDefinition(name);
  currentPresenceId = localStorage.getItem(STORAGE_KEYS.sessionId) || crypto.randomUUID();
  localStorage.setItem(STORAGE_KEYS.sessionId, currentPresenceId);
  const writePresence = () => setDoc(doc(presenceRef, currentPresenceId), {
    name,
    tagKey: tagDefinition?.key || null,
    updatedAt: serverTimestamp()
  });
  await writePresence();
  if (presenceHeartbeat) window.clearInterval(presenceHeartbeat);
  presenceHeartbeat = window.setInterval(() => { writePresence().catch(() => {}); }, PRESENCE_REFRESH_MS);
}
async function stopPresence() {
  if (presenceHeartbeat) { window.clearInterval(presenceHeartbeat); presenceHeartbeat = null; }
  if (presenceRef && currentPresenceId) {
    try { await deleteDoc(doc(presenceRef, currentPresenceId)); }
    catch { return; }
    finally { currentPresenceId = null; }
  }
}
async function joinChat(name) {
  persistUser(name);
  await startPresence(name);
  setChatView(true);
  renderMessages();
  renderOnlineUsers();
}
function hasActiveDuplicateName(name) {
  const normalized = normalizeNameKey(name);
  return getLiveUsers().some((user) => normalizeNameKey(user.name) === normalized && user.sessionId !== currentPresenceId);
}
async function submitProblemReport() {
  if (!creatorInboxRef || !currentUser) throw new Error("Join the chat first.");
  const subject = problemSubjectInput.value.trim();
  const body = problemMessageInput.value.trim();
  if (!subject || !body) throw new Error("Fill in both fields.");
  await addDoc(creatorInboxRef, {
    type: "chat_problem",
    title: `Chat Problem: ${subject}`,
    message: body,
    meta: {
      room: ROOM_NAME,
      senderName: currentUser
    },
    createdAt: serverTimestamp()
  });
}

// ── EVENT LISTENERS ──
joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = normalizeName(usernameInput.value);
  const requiredPassword = getRequiredPassword(name);
  const submittedPassword = passwordInput.value;
  if (!name) { setJoinStatus("Enter a callsign before connecting.", true); return; }
  if (requiredPassword && submittedPassword !== requiredPassword) { setJoinStatus("Protected callsign. Enter the correct access code.", true); return; }
  if (hasActiveDuplicateName(name)) { setJoinStatus("That handle is already online. Choose a different one.", true); return; }
  if (!firebaseReady) { setJoinStatus("System not ready. Check Firebase config.", true); return; }
  try {
    setJoinStatus("Establishing connection...");
    await stopPresence();
    await joinChat(name);
    passwordInput.value = "";
    setJoinStatus("Your handle is only visible inside this channel.");
  } catch { setJoinStatus("Connection failed. Check Firebase rules.", true); }
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text || !currentUser || !firebaseReady) return;
  try {
    if (editingMessageId) {
      await saveEditedMessage(editingMessageId, text);
      editingMessageId = null;
      messageInput.value = "";
      localStorage.removeItem(STORAGE_KEYS.draft);
      autoResizeTextarea();
      updateSendButtonState();
      updateEditStateUI();
      messageInput.focus();
      setJoinStatus("Message updated.");
      return;
    }
    if (isCreatorUser() && await handleCreatorCommand(text)) {
      messageInput.value = "";
      localStorage.removeItem(STORAGE_KEYS.draft);
      autoResizeTextarea();
      updateSendButtonState();
      messageInput.focus();
      return;
    }
    await addMessage({ author: currentUser, text, type: "user", tagKey: getTagDefinition(currentUser)?.key || null });
    messageInput.value = "";
    localStorage.removeItem(STORAGE_KEYS.draft);
    autoResizeTextarea();
    updateSendButtonState();
    messageInput.focus();
  } catch { setJoinStatus("Transmission failed. Check your Firebase setup.", true); }
});

usernameInput.addEventListener("input", updatePasswordPrompt);
messageInput.addEventListener("input", () => {
  localStorage.setItem(STORAGE_KEYS.draft, messageInput.value);
  autoResizeTextarea();
  updateSendButtonState();
});
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" && !messageInput.value.trim() && !editingMessageId) {
    const latestMessage = getLatestEditableMessage();
    if (latestMessage) {
      event.preventDefault();
      startEditingMessage(latestMessage);
    }
    return;
  }
  if (event.key === "Escape" && editingMessageId) {
    event.preventDefault();
    cancelEditingMessage();
    return;
  }
  if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); messageForm.requestSubmit(); }
});

changeNameBtn.addEventListener("click", async () => {
  await stopPresence(); setChatView(false); usernameInput.value = currentUser;
  updatePasswordPrompt(); setJoinStatus("Choose a new callsign and reconnect.");
});
mobileChangeNameBtn.addEventListener("click", async () => {
  closeMobileSidebar(); await stopPresence(); setChatView(false);
  usernameInput.value = currentUser; updatePasswordPrompt(); setJoinStatus("Choose a new callsign and reconnect.");
});
logoutBtn.addEventListener("click", async () => { await performLocalLogout("Connection terminated."); });
mobileLogoutBtn.addEventListener("click", async () => { closeMobileSidebar(); await performLocalLogout("Connection terminated."); });
[problemBtn, mobileProblemBtn].forEach((button) => {
  button.addEventListener("click", () => {
    if (button === mobileProblemBtn) closeMobileSidebar();
    openProblemModal();
  });
});
problemCloseBtn.addEventListener("click", closeProblemModal);
problemModal.addEventListener("click", (event) => {
  if (event.target === problemModal) closeProblemModal();
});
problemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  problemStatus.textContent = "Sending...";
  try {
    await submitProblemReport();
    problemStatus.textContent = "Issue sent to the creator inbox.";
    problemForm.reset();
    window.setTimeout(() => {
      problemStatus.textContent = "";
      closeProblemModal();
    }, 900);
  } catch (error) {
    problemStatus.textContent = error.message || "Could not send your issue.";
  }
});
editCancelBtn.addEventListener("click", () => cancelEditingMessage());

clearChatBtn.addEventListener("click", async () => {
  if (!firebaseReady || !messagesRef || !isElevatedUser()) return;
  clearChatBtn.disabled = true;
  try {
    const snapshot = await getDocs(query(messagesRef, limit(MAX_MESSAGES)));
    await Promise.all(snapshot.docs.map((snapshotDoc) => deleteDoc(doc(db, "rooms", ROOM_NAME, "messages", snapshotDoc.id))));
  } catch { setJoinStatus("Could not clear channel.", true); }
  finally { clearChatBtn.disabled = false; }
});

mobileClearChatBtn.addEventListener("click", async () => {
  closeMobileSidebar();
  if (!firebaseReady || !messagesRef || !isElevatedUser()) return;
  clearChatBtn.disabled = true;
  mobileClearChatBtn.disabled = true;
  try {
    const snapshot = await getDocs(query(messagesRef, limit(MAX_MESSAGES)));
    await Promise.all(snapshot.docs.map((snapshotDoc) => deleteDoc(doc(db, "rooms", ROOM_NAME, "messages", snapshotDoc.id))));
  } catch { setJoinStatus("Could not clear channel.", true); }
  finally { clearChatBtn.disabled = false; mobileClearChatBtn.disabled = false; }
});

const savedUser = normalizeName(localStorage.getItem(STORAGE_KEYS.username) || "");
const savedDraft = localStorage.getItem(STORAGE_KEYS.draft) || "";
try { seenMentions = new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.seenMentions) || "[]")); }
catch { seenMentions = new Set(); }

setupFirebase();

if (savedUser) usernameInput.value = savedUser;
updatePasswordPrompt();
messageInput.value = savedDraft;
renderMessages();
renderOnlineUsers();
renderPinnedState();
renderBroadcastState();
renderSiteNotifications();
autoResizeTextarea();
updateSendButtonState();
updateEditStateUI();

if (savedUser && firebaseReady && !getRequiredPassword(savedUser) && !hasActiveDuplicateName(savedUser)) {
  joinChat(savedUser).catch(() => { setJoinStatus("Saved node could not auto-connect. Join manually.", true); });
} else {
  if (savedUser && hasActiveDuplicateName(savedUser)) {
    setJoinStatus("Your saved handle is already online elsewhere. Join with a different one.", true);
  }
  usernameInput.focus();
}

// ── MOBILE POPUP (pin & alert on mobile) ──
const mobilePopupOverlay = document.getElementById("mobilePopupOverlay");
const mobilePopupTitle = document.getElementById("mobilePopupTitle");
const mobilePopupBody = document.getElementById("mobilePopupBody");
const mobilePopupCloseBtn = document.getElementById("mobilePopupCloseBtn");

function openMobilePopup(title, contentEl) {
  mobilePopupTitle.textContent = title;
  mobilePopupBody.innerHTML = contentEl ? contentEl.innerHTML : "<p class='empty-users'>Nothing here yet.</p>";
  mobilePopupOverlay.classList.remove("hidden");
  mobilePopupOverlay.classList.add("active");
}
function closeMobilePopup() {
  mobilePopupOverlay.classList.add("hidden");
  mobilePopupOverlay.classList.remove("active");
}
mobilePopupCloseBtn.addEventListener("click", closeMobilePopup);
mobilePopupOverlay.addEventListener("click", (e) => { if (e.target === mobilePopupOverlay) closeMobilePopup(); });

// On mobile, pin and alert buttons open the center popup instead of the floating panel
mobilePinToggle.addEventListener("click", () => {
  if (window.innerWidth <= 1080) {
    openMobilePopup("// Pinned Message", pinPanelBody);
  }
});
mobileGlobalAlertToggle.addEventListener("click", () => {
  if (window.innerWidth <= 1080) {
    openMobilePopup("// DLNGR Notifications", alertPanelBody);
  }
});

function closeMobileSidebar() {
  chatPanel.classList.remove("is-sidebar-open");
  mobileOverlay.classList.add("hidden");
  mobileDrawer.classList.add("hidden");
}
function openMobileSidebar() {
  chatPanel.classList.add("is-sidebar-open");
  mobileOverlay.classList.remove("hidden");
  mobileDrawer.classList.remove("hidden");
}

mobileSidebarToggle.addEventListener("click", () => {
  if (chatPanel.classList.contains("is-sidebar-open")) closeMobileSidebar();
  else openMobileSidebar();
});
mobileOverlay.addEventListener("click", closeMobileSidebar);
mobileMediaToggle.addEventListener("click", () => {
  if (!sharedMediaState?.url) return;
  mobileMedia.classList.remove("hidden");
});
mobileMediaCloseBtn.addEventListener("click", closeMobileMedia);
mobileDrawerCloseBtn.addEventListener("click", closeMobileSidebar);
desktopBellToggle.addEventListener("click", toggleNotifications);
mobileBellToggle.addEventListener("click", toggleNotifications);
desktopPinToggle.addEventListener("click", togglePinPanel);
pinPanelCloseBtn.addEventListener("click", closePinPanel);
globalAlertToggle.addEventListener("click", toggleAlertPanel);
notificationCloseBtn.addEventListener("click", closeNotifications);
alertPanelCloseBtn.addEventListener("click", closeAlertPanel);
mediaCloseBtn.addEventListener("click", () => {
  if (isCreatorUser()) closeSharedMedia().catch(() => { setJoinStatus("Could not close feed.", true); });
});
window.addEventListener("resize", renderSharedMedia);
window.addEventListener("beforeunload", () => {
  if (unsubscribeMessages) unsubscribeMessages();
  if (unsubscribePresence) unsubscribePresence();
  if (unsubscribeMedia) unsubscribeMedia();
  if (unsubscribeControl) unsubscribeControl();
  if (unsubscribePinned) unsubscribePinned();
  if (unsubscribeSiteNotifications) unsubscribeSiteNotifications();
  if (presencePruneTimer) window.clearInterval(presencePruneTimer);
  if (broadcastExpiryTimer) window.clearTimeout(broadcastExpiryTimer);
  stopPresence();
});

