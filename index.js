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

// Add more custom roles here to style messages and badges for selected names.
const USER_TAGS = [
  {
    key: "creator",
    label: "Creator",
    names: ["udit"],
    badgeClass: "tag-badge--creator",
    messageClass: "message--creator"
  },
  {
    key: "admin",
    label: "Admin",
    names: ["supergaming94"],
    badgeClass: "tag-badge--admin",
    messageClass: "message--admin"
  }
];

// Add more creator-only media shortcuts here.
const MEDIA_SHORTCUTS = {
  "/67": {
    type: "yt",
    url: "https://www.youtube.com/watch?v=Jeu66nEnwqMw"
  }
};

const STORAGE_KEYS = {
  username: "dlngrchat_username",
  draft: "dlngrchat_draft",
  sessionId: "dlngrchat_session_id",
  seenMentions: "dlngrchat_seen_mentions",
  handledLogoutAll: "dlngrchat_handled_logout_all"
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
const roomNote = document.getElementById("roomNote");
const mobileRoomNote = document.getElementById("mobileRoomNote");
const onlineUsers = document.getElementById("onlineUsers");
const onlineCount = document.getElementById("onlineCount");
const mobileOnlineUsers = document.getElementById("mobileOnlineUsers");
const mobileOnlineCount = document.getElementById("mobileOnlineCount");
const messagesContainer = document.getElementById("messages");
const messageTemplate = document.getElementById("messageTemplate");
const changeNameBtn = document.getElementById("changeNameBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const logoutBtn = document.getElementById("logoutBtn");
const mobileSidebarToggle = document.getElementById("mobileSidebarToggle");
const mobileOverlay = document.getElementById("mobileOverlay");
const sendMessageBtn = document.getElementById("sendMessageBtn");
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
const desktopBellToggle = document.getElementById("desktopBellToggle");
const desktopBellBadge = document.getElementById("desktopBellBadge");
const mobileBellToggle = document.getElementById("mobileBellToggle");
const mobileBellBadge = document.getElementById("mobileBellBadge");
const notificationPanel = document.getElementById("notificationPanel");
const notificationList = document.getElementById("notificationList");
const notificationCloseBtn = document.getElementById("notificationCloseBtn");

let currentUser = "";
let messages = [];
let onlineSessions = [];
let db = null;
let messagesRef = null;
let presenceRef = null;
let sharedMediaRef = null;
let controlRef = null;
let unsubscribeMessages = null;
let unsubscribePresence = null;
let unsubscribeMedia = null;
let unsubscribeControl = null;
let firebaseReady = false;
let presenceHeartbeat = null;
let presencePruneTimer = null;
let currentPresenceId = null;
let sharedMediaState = null;
let lastMentionCount = 0;
let seenMentions = new Set();

function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => value && !String(value).startsWith("PASTE_YOUR_"));
}

function normalizeName(name) {
  return (name || "").trim().replace(/\s+/g, " ").slice(0, 24);
}

function normalizeNameKey(name) {
  return normalizeName(name).toLowerCase();
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function autoResizeTextarea() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${messageInput.scrollHeight}px`;
}

function updateSendButtonState() {
  sendMessageBtn.disabled = !messageInput.value.trim();
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

function getRequiredPassword(name) {
  return getMatchedRule(name)?.password || null;
}

function getTagDefinition(name) {
  const key = normalizeNameKey(name);
  const ruleTagKey = getMatchedRule(name)?.tagKey;
  if (ruleTagKey) {
    return USER_TAGS.find((tag) => tag.key === ruleTagKey) || null;
  }

  if (key.includes("udit")) {
    return USER_TAGS.find((tag) => tag.key === "creator") || null;
  }

  return USER_TAGS.find((tag) => tag.names.some((tagName) => normalizeNameKey(tagName) === key)) || null;
}

function isElevatedUser(name = currentUser) {
  const tag = getTagDefinition(name);
  return tag?.key === "creator" || tag?.key === "admin";
}

function isCreatorUser(name = currentUser) {
  return getTagDefinition(name)?.key === "creator";
}

function messageMentionsCurrentUser(text) {
  const nameKey = normalizeNameKey(currentUser);
  if (!nameKey || !text) {
    return false;
  }

  const mentionRegex = new RegExp(`(^|\\s)@${nameKey}(?=\\b|\\s|$)`, "i");
  return mentionRegex.test(text);
}

function applyTagBadge(element, tagDefinition) {
  element.className = "tag-badge";

  if (!tagDefinition) {
    element.textContent = "";
    element.classList.add("hidden");
    return;
  }

  element.textContent = tagDefinition.label;
  element.classList.remove("hidden");

  if (tagDefinition.badgeClass) {
    element.classList.add(tagDefinition.badgeClass);
  }
}

function updatePasswordPrompt() {
  const requiredPassword = getRequiredPassword(usernameInput.value);
  passwordWrap.classList.toggle("hidden", !requiredPassword);
  passwordInput.required = Boolean(requiredPassword);

  if (!requiredPassword) {
    passwordInput.value = "";
  }
}

function closeNotifications() {
  notificationPanel.classList.add("hidden");
}

function toggleNotifications() {
  notificationPanel.classList.toggle("hidden");
}

function scrollToMessage(messageId) {
  const target = messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
  if (!target) {
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("message--mention-flash");
  window.setTimeout(() => {
    target.classList.remove("message--mention-flash");
  }, 2200);
}

function renderNotifications() {
  const mentionMessages = messages.filter((message) => message.type === "user" && message.author !== currentUser && messageMentionsCurrentUser(message.text));
  const unseenMentions = mentionMessages.filter((message) => !seenMentions.has(message.id));
  const count = unseenMentions.length;
  const countText = String(count);

  desktopBellBadge.textContent = countText;
  mobileBellBadge.textContent = countText;
  desktopBellBadge.classList.toggle("hidden", count === 0);
  mobileBellBadge.classList.toggle("hidden", count === 0);

  if (count === 0) {
    notificationList.innerHTML = "<p class='empty-users'>No mentions yet.</p>";
    lastMentionCount = 0;
    return;
  }

  if (count > lastMentionCount) {
    notificationPanel.classList.remove("hidden");
  }

  lastMentionCount = count;
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
  if (!url) {
    return "";
  }

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
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return "";
  }

  return "";
}

function resolveMediaUrl(type, url) {
  if (type === "yt") {
    return toYouTubeEmbed(url);
  }

  return normalizeWebsiteUrl(url);
}

function clearNode(node) {
  node.innerHTML = "";
}

function buildMediaFrame(target, mediaState) {
  clearNode(target);

  if (!mediaState?.url) {
    return;
  }

  const frame = document.createElement("iframe");
  frame.className = "media-frame";
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.referrerPolicy = "strict-origin-when-cross-origin";
  frame.allowFullscreen = true;
  frame.src = mediaState.url;
  target.appendChild(frame);
}

function closeMobileMedia() {
  mobileMedia.classList.add("hidden");
}

function renderSharedMedia() {
  const hasMedia = Boolean(sharedMediaState?.url);
  const fullForViewers = Boolean(sharedMediaState?.fullForViewers);
  const creatorView = isCreatorUser();

  mediaPanel.classList.toggle("hidden", !hasMedia);
  mobileMediaToggle.classList.toggle("hidden", !hasMedia);
  mobileMediaToggle.classList.toggle("mobile-media-toggle--alert", hasMedia);
  chatPanel.classList.toggle("chat-panel--with-media", hasMedia);
  chatPanel.classList.toggle("media-full-viewer", hasMedia && fullForViewers && !creatorView && window.innerWidth > 760);

  if (!hasMedia) {
    clearNode(mediaPanelBody);
    clearNode(mobileMediaBody);
    closeMobileMedia();
    return;
  }

  buildMediaFrame(mediaPanelBody, sharedMediaState);
  buildMediaFrame(mobileMediaBody, sharedMediaState);
}

async function updateSharedMedia(nextState) {
  if (!sharedMediaRef) {
    return;
  }

  await setDoc(sharedMediaRef, {
    ...nextState,
    updatedAt: serverTimestamp()
  });
}

async function forceLogoutAll() {
  if (!controlRef) {
    return;
  }

  await setDoc(controlRef, {
    logoutAllAt: Date.now(),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

async function performLocalLogout(message = "You have been logged out.") {
  await stopPresence();
  currentUser = "";
  localStorage.removeItem(STORAGE_KEYS.username);
  localStorage.removeItem(STORAGE_KEYS.draft);
  localStorage.removeItem(STORAGE_KEYS.sessionId);
  messageInput.value = "";
  passwordInput.value = "";
  usernameInput.value = "";
  clearChatBtn.classList.add("hidden");
  mobileClearChatBtn.classList.add("hidden");
  setChatView(false);
  updatePasswordPrompt();
  autoResizeTextarea();
  updateSendButtonState();
  setJoinStatus(message);
}

async function closeSharedMedia() {
  if (!isCreatorUser() || !sharedMediaRef) {
    return;
  }

  await setDoc(sharedMediaRef, {
    type: "",
    url: "",
    fullForViewers: false,
    updatedAt: serverTimestamp()
  });
}

function parseCreatorCommand(text) {
  const trimmed = text.trim();

  if (!trimmed.startsWith("/")) {
    return null;
  }

  const [command, ...rest] = trimmed.split(/\s+/);
  const argument = rest.join(" ").trim();

  if (MEDIA_SHORTCUTS[command]) {
    return {
      kind: "media",
      type: MEDIA_SHORTCUTS[command].type,
      url: resolveMediaUrl(MEDIA_SHORTCUTS[command].type, MEDIA_SHORTCUTS[command].url)
    };
  }

  if (command === "/website") {
    if (argument.toLowerCase() === "close") {
      return { kind: "close" };
    }

    return {
      kind: "media",
      type: "website",
      url: resolveMediaUrl("website", argument)
    };
  }

  if (command === "/yt") {
    if (argument.toLowerCase() === "close") {
      return { kind: "close" };
    }

    return {
      kind: "media",
      type: "yt",
      url: resolveMediaUrl("yt", argument)
    };
  }

  if (command === "/full") {
    return {
      kind: "full",
      enabled: argument.toLowerCase() !== "close"
    };
  }

  if (command === "/logoutall") {
    return { kind: "logoutall" };
  }

  return null;
}

async function handleCreatorCommand(text) {
  const command = parseCreatorCommand(text);

  if (!command) {
    return false;
  }

  if (command.kind === "close") {
    await closeSharedMedia();
    setJoinStatus("Shared media closed.");
    return true;
  }

  if (command.kind === "full") {
    if (!sharedMediaState?.url) {
      setJoinStatus("Open a website or video first before using /full.", true);
      return true;
    }

    await updateSharedMedia({
      ...sharedMediaState,
      fullForViewers: command.enabled
    });
    setJoinStatus(command.enabled ? "Shared media is now full view for viewers." : "Shared media returned to side view.");
    return true;
  }

  if (command.kind === "logoutall") {
    await forceLogoutAll();
    return true;
  }

  if (!command.url) {
    setJoinStatus("That media command needs a valid URL.", true);
    return true;
  }

  await updateSharedMedia({
    type: command.type,
    url: command.url,
    fullForViewers: false
  });
  setJoinStatus("Shared media opened.");
  return true;
}

function setChatView(enabled) {
  joinPanel.classList.toggle("hidden", enabled);
  chatPanel.classList.toggle("hidden", !enabled);
  chatPanel.classList.remove("is-sidebar-open");
  mobileOverlay.classList.add("hidden");
  mobileDrawer.classList.add("hidden");
  closeNotifications();

  if (enabled) {
    activeUsername.textContent = currentUser;
    mobileActiveUsername.textContent = currentUser;
    applyTagBadge(activeUserTag, getTagDefinition(currentUser));
    applyTagBadge(mobileActiveUserTag, getTagDefinition(currentUser));
    updateSendButtonState();
    renderSharedMedia();
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
  if (!firebaseReady || !messagesRef) {
    throw new Error("Firebase is not configured yet.");
  }

  return addDoc(messagesRef, {
    author: message.author,
    text: message.text,
    type: message.type,
    tagKey: message.tagKey || null,
    ownerSessionId: message.ownerSessionId || currentPresenceId || null,
    createdAt: serverTimestamp()
  });
}

function canDeleteMessage(message) {
  if (message.type === "system") {
    return false;
  }

  if (isElevatedUser()) {
    return true;
  }

  return Boolean(currentPresenceId && message.ownerSessionId === currentPresenceId);
}

async function copyMessageText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const previous = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = previous;
    }, 1200);
  } catch {
    setJoinStatus("Copy failed in this browser.", true);
  }
}

async function deleteMessageById(id) {
  if (!messagesRef || !id) {
    return;
  }

  try {
    await deleteDoc(doc(db, "rooms", ROOM_NAME, "messages", id));
  } catch {
    setJoinStatus("Could not delete that message.", true);
  }
}

function renderMessages() {
  messagesContainer.innerHTML = "";

  if (messages.length === 0) {
    const emptyState = document.createElement("article");
    emptyState.className = "message message--system";
    emptyState.innerHTML = "<p class='message__text'>No messages yet. Start the room.</p>";
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
    const deleteButton = fragment.querySelector(".message__delete");
    const tagDefinition = USER_TAGS.find((tag) => tag.key === message.tagKey) || getTagDefinition(message.author);
    const hasMention = messageMentionsCurrentUser(message.text);

    author.textContent = message.author;
    time.textContent = formatTime(message.timestamp || Date.now());
    text.innerHTML = escapeHtml(message.text).replaceAll("\n", "<br>");
    applyTagBadge(tagBadge, tagDefinition);
    copyButton.addEventListener("click", () => copyMessageText(message.text, copyButton));
    card.dataset.messageId = message.id;

    if (message.type === "system") {
      card.classList.add("message--system");
    } else if (message.author === currentUser) {
      card.classList.add("message--self");
    }

    if (hasMention) {
      card.classList.add("message--mention");
    }

    if (tagDefinition?.messageClass) {
      card.classList.add("message--tagged", tagDefinition.messageClass);
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
    emptyState.textContent = "Nobody is online yet.";
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

    if (!badge.classList.contains("hidden")) {
      card.append(badge);
    }

    target.appendChild(card);
  });
}

function renderOnlineUsers() {
  const liveUsers = onlineSessions
    .filter((user) => Date.now() - user.lastSeen < PRESENCE_TTL_MS)
    .sort((left, right) => left.name.localeCompare(right.name));

  const countText = `${liveUsers.length} user${liveUsers.length === 1 ? "" : "s"} online`;

  onlineCount.textContent = countText;
  mobileOnlineCount.textContent = countText;

  renderUserList(onlineUsers, liveUsers);
  renderUserList(mobileOnlineUsers, liveUsers);
}

function createSystemMessage(text) {
  return {
    author: "System",
    text,
    type: "system"
  };
}

function setupFirebase() {
  if (!hasFirebaseConfig()) {
    setJoinStatus("Add your Firebase keys in dlngrchat.js before using live chat.", true);
    return;
  }

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  messagesRef = collection(db, "rooms", ROOM_NAME, "messages");
  presenceRef = collection(db, "rooms", ROOM_NAME, "presence");
  sharedMediaRef = doc(db, "rooms", ROOM_NAME, "shared", "media");
  controlRef = doc(db, "rooms", ROOM_NAME, "shared", "control");
  firebaseReady = true;
  subscribeToMessages();
  subscribeToPresence();
  subscribeToSharedMedia();
  subscribeToControls();
}

function subscribeToMessages() {
  if (!firebaseReady || !messagesRef) {
    return;
  }

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
        timestamp: data.createdAt?.toMillis?.() || Date.now()
      };
    });

    renderMessages();
  });
}

function subscribeToPresence() {
  if (!firebaseReady || !presenceRef) {
    return;
  }

  unsubscribePresence = onSnapshot(presenceRef, (snapshot) => {
    onlineSessions = snapshot.docs.map((snapshotDoc) => {
      const data = snapshotDoc.data();
      return {
        sessionId: snapshotDoc.id,
        name: data.name || "Guest",
        tagKey: data.tagKey || null,
        lastSeen: data.updatedAt?.toMillis?.() || 0
      };
    });

    renderOnlineUsers();
  });

  presencePruneTimer = window.setInterval(renderOnlineUsers, 10000);
}

function subscribeToSharedMedia() {
  if (!firebaseReady || !sharedMediaRef) {
    return;
  }

  unsubscribeMedia = onSnapshot(sharedMediaRef, (snapshot) => {
    const data = snapshot.data();
    sharedMediaState = data?.url ? {
      type: data.type || "website",
      url: data.url || "",
      fullForViewers: Boolean(data.fullForViewers)
    } : null;

    renderSharedMedia();
  });
}

function subscribeToControls() {
  if (!firebaseReady || !controlRef) {
    return;
  }

  unsubscribeControl = onSnapshot(controlRef, (snapshot) => {
    const data = snapshot.data();
    const logoutAllAt = Number(data?.logoutAllAt || 0);
    const handled = Number(localStorage.getItem(STORAGE_KEYS.handledLogoutAll) || 0);

    if (logoutAllAt && logoutAllAt > handled && currentUser) {
      localStorage.setItem(STORAGE_KEYS.handledLogoutAll, String(logoutAllAt));
      performLocalLogout("Creator logged out all sessions.").catch(() => {});
    }
  });
}

async function startPresence(name) {
  if (!presenceRef) {
    return;
  }

  const tagDefinition = getTagDefinition(name);
  currentPresenceId = localStorage.getItem(STORAGE_KEYS.sessionId) || crypto.randomUUID();
  localStorage.setItem(STORAGE_KEYS.sessionId, currentPresenceId);

  const writePresence = () => setDoc(doc(presenceRef, currentPresenceId), {
    name,
    tagKey: tagDefinition?.key || null,
    updatedAt: serverTimestamp()
  });

  await writePresence();

  if (presenceHeartbeat) {
    window.clearInterval(presenceHeartbeat);
  }

  presenceHeartbeat = window.setInterval(() => {
    writePresence().catch(() => {});
  }, PRESENCE_REFRESH_MS);
}

async function stopPresence() {
  if (presenceHeartbeat) {
    window.clearInterval(presenceHeartbeat);
    presenceHeartbeat = null;
  }

  if (presenceRef && currentPresenceId) {
    try {
      await deleteDoc(doc(presenceRef, currentPresenceId));
    } catch {
      return;
    } finally {
      currentPresenceId = null;
    }
  }
}

async function joinChat(name) {
  persistUser(name);
  await startPresence(name);
  setChatView(true);
  renderMessages();
  renderOnlineUsers();
}

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = normalizeName(usernameInput.value);
  const requiredPassword = getRequiredPassword(name);
  const submittedPassword = passwordInput.value;

  if (!name) {
    setJoinStatus("Please enter a name before joining.", true);
    return;
  }

  if (requiredPassword && submittedPassword !== requiredPassword) {
    setJoinStatus("That name is protected. Enter the correct password.", true);
    return;
  }

  if (!firebaseReady) {
    setJoinStatus("Firebase is not ready yet. Check your project config first.", true);
    return;
  }

  try {
    setJoinStatus("Joining room...");
    await stopPresence();
    await joinChat(name);
    passwordInput.value = "";
    setJoinStatus("Your name is only used inside this chat.");
  } catch {
    setJoinStatus("Could not join the room. Check Firebase rules and config.", true);
  }
});

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();

  if (!text || !currentUser || !firebaseReady) {
    return;
  }

  try {
    if (isCreatorUser() && await handleCreatorCommand(text)) {
      messageInput.value = "";
      localStorage.removeItem(STORAGE_KEYS.draft);
      autoResizeTextarea();
      updateSendButtonState();
      messageInput.focus();
      return;
    }

    await addMessage({
      author: currentUser,
      text,
      type: "user",
      tagKey: getTagDefinition(currentUser)?.key || null
    });

    messageInput.value = "";
    localStorage.removeItem(STORAGE_KEYS.draft);
    autoResizeTextarea();
    updateSendButtonState();
    messageInput.focus();
  } catch {
    setJoinStatus("Message failed to send. Check your Firebase setup.", true);
  }
});

usernameInput.addEventListener("input", updatePasswordPrompt);

messageInput.addEventListener("input", () => {
  localStorage.setItem(STORAGE_KEYS.draft, messageInput.value);
  autoResizeTextarea();
  updateSendButtonState();
});

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    messageForm.requestSubmit();
  }
});

changeNameBtn.addEventListener("click", async () => {
  await stopPresence();
  setChatView(false);
  usernameInput.value = currentUser;
  updatePasswordPrompt();
  setJoinStatus("Choose a new name and join again.");
});

mobileChangeNameBtn.addEventListener("click", async () => {
  closeMobileSidebar();
  await stopPresence();
  setChatView(false);
  usernameInput.value = currentUser;
  updatePasswordPrompt();
  setJoinStatus("Choose a new name and join again.");
});

logoutBtn.addEventListener("click", async () => {
  await performLocalLogout("You have been logged out.");
});

mobileLogoutBtn.addEventListener("click", async () => {
  closeMobileSidebar();
  await performLocalLogout("You have been logged out.");
});

clearChatBtn.addEventListener("click", async () => {
  if (!firebaseReady || !messagesRef || !isElevatedUser()) {
    return;
  }

  clearChatBtn.disabled = true;

  try {
    const snapshot = await getDocs(query(messagesRef, limit(MAX_MESSAGES)));
    await Promise.all(snapshot.docs.map((snapshotDoc) => deleteDoc(doc(db, "rooms", ROOM_NAME, "messages", snapshotDoc.id))));
  } catch {
    setJoinStatus("Could not clear chat. Update your Firestore rules if needed.", true);
  } finally {
    clearChatBtn.disabled = false;
  }
});

mobileClearChatBtn.addEventListener("click", async () => {
  closeMobileSidebar();
  if (!firebaseReady || !messagesRef || !isElevatedUser()) {
    return;
  }

  clearChatBtn.disabled = true;
  mobileClearChatBtn.disabled = true;

  try {
    const snapshot = await getDocs(query(messagesRef, limit(MAX_MESSAGES)));
    await Promise.all(snapshot.docs.map((snapshotDoc) => deleteDoc(doc(db, "rooms", ROOM_NAME, "messages", snapshotDoc.id))));
  } catch {
    setJoinStatus("Could not clear chat. Update your Firestore rules if needed.", true);
  } finally {
    clearChatBtn.disabled = false;
    mobileClearChatBtn.disabled = false;
  }
});

const savedUser = normalizeName(localStorage.getItem(STORAGE_KEYS.username) || "");
const savedDraft = localStorage.getItem(STORAGE_KEYS.draft) || "";
try {
  seenMentions = new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.seenMentions) || "[]"));
} catch {
  seenMentions = new Set();
}

setupFirebase();

if (savedUser) {
  usernameInput.value = savedUser;
}

updatePasswordPrompt();
messageInput.value = savedDraft;
renderMessages();
renderOnlineUsers();
autoResizeTextarea();
updateSendButtonState();

if (savedUser && firebaseReady && !getRequiredPassword(savedUser)) {
  joinChat(savedUser).catch(() => {
    setJoinStatus("Saved user could not auto-join. Try joining manually.", true);
  });
} else {
  usernameInput.focus();
}

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
  if (chatPanel.classList.contains("is-sidebar-open")) {
    closeMobileSidebar();
  } else {
    openMobileSidebar();
  }
});

mobileOverlay.addEventListener("click", closeMobileSidebar);
mobileMediaToggle.addEventListener("click", () => {
  if (!sharedMediaState?.url) {
    return;
  }

  mobileMedia.classList.remove("hidden");
});
mobileMediaCloseBtn.addEventListener("click", closeMobileMedia);
mobileDrawerCloseBtn.addEventListener("click", closeMobileSidebar);
desktopBellToggle.addEventListener("click", toggleNotifications);
mobileBellToggle.addEventListener("click", toggleNotifications);
notificationCloseBtn.addEventListener("click", closeNotifications);
mediaCloseBtn.addEventListener("click", () => {
  if (isCreatorUser()) {
    closeSharedMedia().catch(() => {
      setJoinStatus("Could not close shared media.", true);
    });
  }
});
window.addEventListener("resize", renderSharedMedia);

window.addEventListener("beforeunload", () => {
  if (unsubscribeMessages) {
    unsubscribeMessages();
  }

  if (unsubscribePresence) {
    unsubscribePresence();
  }

  if (unsubscribeMedia) {
    unsubscribeMedia();
  }

  if (unsubscribeControl) {
    unsubscribeControl();
  }

  if (presencePruneTimer) {
    window.clearInterval(presencePruneTimer);
  }

  stopPresence();
});
