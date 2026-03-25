(function () {
  const firebaseConfig = window.firebaseConfig;
  const SERVER_TIME = firebase.firestore.FieldValue.serverTimestamp;
  const ONLINE_WINDOW_MS = 2 * 60 * 1000;

  const state = {
    currentUser: null,
    currentProfile: null,
    chats: [],
    users: [],
    activeChatId: null,
    activeChatUnsubscribe: null,
    chatsUnsubscribe: null,
    usersUnsubscribe: null,
    filterValue: "",
    isMobileChatOpen: false,
    isSidebarOpen: false,
    isChatPickerOpen: false,
    isDeletingAccount: false
  };

  const authView = document.getElementById("authView");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const authNameField = document.getElementById("authNameField");
  const authNameInput = document.getElementById("authNameInput");
  const authEmailInput = document.getElementById("authEmailInput");
  const authPasswordInput = document.getElementById("authPasswordInput");
  const authSubmitButton = document.getElementById("authSubmitButton");
  const authToggleButton = document.getElementById("authToggleButton");
  const authStatus = document.getElementById("authStatus");
  const appShell = document.getElementById("appShell");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const chatPickerBackdrop = document.getElementById("chatPickerBackdrop");
  const chatPickerList = document.getElementById("chatPickerList");
  const closeChatPickerButton = document.getElementById("closeChatPickerButton");
  const menuToggleButton = document.getElementById("menuToggleButton");
  const mobileBackButton = document.getElementById("mobileBackButton");
  const threadList = document.getElementById("threadList");
  const messageList = document.getElementById("messageList");
  const activeName = document.getElementById("activeName");
  const activeStatus = document.getElementById("activeStatus");
  const activeAvatar = document.getElementById("activeAvatar");
  const messageForm = document.getElementById("messageForm");
  const messageInput = document.getElementById("messageInput");
  const searchInput = document.getElementById("searchInput");
  const currentUserName = document.getElementById("currentUserName");
  const currentUserHandle = document.getElementById("currentUserHandle");
  const currentUserAvatar = document.getElementById("currentUserAvatar");
  const peopleList = document.getElementById("peopleList");
  const newChatButton = document.getElementById("newChatButton");
  const openPickerButton = document.getElementById("openPickerButton");
  const deleteChatButton = document.getElementById("deleteChatButton");
  const clearChatsButton = document.getElementById("clearChatsButton");
  const logoutButton = document.getElementById("logoutButton");
  const deleteAccountButton = document.getElementById("deleteAccountButton");
  const removeUserButton = document.getElementById("removeUserButton");
  const banUserButton = document.getElementById("banUserButton");
  const setupBanner = document.getElementById("setupBanner");
  const requestPanel = document.getElementById("requestPanel");
  const requestTitle = document.getElementById("requestTitle");
  const requestText = document.getElementById("requestText");
  const requestActions = document.getElementById("requestActions");
  const acceptRequestButton = document.getElementById("acceptRequestButton");
  const rejectRequestButton = document.getElementById("rejectRequestButton");
  const conversationVideo = document.getElementById("conversationVideo");

  let isLoginMode = true;
  let auth = null;
  let db = null;
  let presenceTimer = null;
  let authNotice = "";

  const CREATOR_EMAIL = "rajeshvishavkarma390@gmail.com";
  const RESERVED_NAMES = ["dlngr", "dlngr store", "dlngr ai"];

  function isCreator(user) {
    return !!user && user.email === CREATOR_EMAIL;
  }

  function normalizeNameKey(name) {
    return String(name || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function emailLocalPart(email) {
    return String(email || "").split("@")[0].trim().toLowerCase();
  }

  function nameLooksLikeEmailPrefix(name, email) {
    return normalizeNameKey(name) === emailLocalPart(email);
  }

  function isConfigMissing() {
    return !firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey === "REPLACE_ME";
  }

  function isFileProtocol() {
    return window.location.protocol === "file:";
  }

  function isMobileViewport() {
    return window.innerWidth <= 860;
  }

  function initialsFromName(name) {
    return (name || "User")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join("");
  }

  function normalizeDisplayName(user) {
    if (!user) return "User";
    if (user.displayName && user.displayName.trim()) return user.displayName.trim();
    if (user.fullName && user.fullName.trim()) return user.fullName.trim();
    return "User";
  }

  function getLiveUserById(uid) {
    return state.users.find(function (user) { return user.uid === uid; }) || null;
  }

  function hydrateMember(member) {
    if (!member || !member.uid) return member;
    const liveUser = getLiveUserById(member.uid);
    if (!liveUser) return member;
    return Object.assign({}, member, liveUser, {
      displayName: normalizeDisplayName(liveUser),
      isOnline: isUserLive(liveUser)
    });
  }

  function isUserLive(user) {
    if (!user) return false;
    if (!user.lastSeen) return user.isOnline === true;
    const date = user.lastSeen.toDate ? user.lastSeen.toDate() : new Date(user.lastSeen);
    return user.isOnline === true && Date.now() - date.getTime() < ONLINE_WINDOW_MS;
  }

  function getUserBadges(user) {
    if (!isCreator(user)) {
      return [];
    }
    return ["Creator", "VIP", "MVP"];
  }

  function renderBadges(user) {
    const badges = getUserBadges(user);
    if (!badges.length) return "";
    return '<span class="badge-list">' + badges.map(function (badge) {
      return '<span class="user-badge">' + escapeHtml(badge) + '</span>';
    }).join("") + '</span>';
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatTime(value) {
    if (!value) return "Sending...";
    const date = value.toDate ? value.toDate() : new Date(value);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function formatRelative(value) {
    if (!value) return "new";
    const date = value.toDate ? value.toDate() : new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return diffMin + "m";
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return diffHour + "h";
    return Math.floor(diffHour / 24) + "d";
  }

  function setAuthMode(loginMode) {
    isLoginMode = loginMode;
    authTitle.textContent = loginMode ? "Welcome back" : "Create your account";
    authSubtitle.textContent = loginMode ? "Sign in to your live PriveChat." : "Join the chat and start messaging in real time.";
    authNameField.hidden = loginMode;
    authSubmitButton.textContent = loginMode ? "Login" : "Create account";
    authToggleButton.textContent = loginMode ? "Need an account? Sign up" : "Already have an account? Login";
    authStatus.textContent = "";
  }

  function setAuthStatus(message) {
    authStatus.textContent = message || "";
  }

  function setAuthenticatedUi(isAuthenticated) {
    authView.hidden = isAuthenticated;
    appShell.hidden = !isAuthenticated;
    menuToggleButton.hidden = !isAuthenticated;
  }

  function tryPlayConversationVideo() {
    if (!conversationVideo) return;
    conversationVideo.muted = true;
    conversationVideo.defaultMuted = true;
    conversationVideo.loop = true;
    const playPromise = conversationVideo.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        return null;
      });
    }
  }

  function resetToAuthScreen(message) {
    cleanupListeners();
    state.currentUser = null;
    state.currentProfile = null;
    state.chats = [];
    state.users = [];
    state.activeChatId = null;
    threadList.innerHTML = "";
    messageList.innerHTML = '<div class="empty-state">Choose a chat to start messaging.</div>';
    setSidebarOpen(false);
    setMobileChatOpen(false);
    setAuthenticatedUi(false);
    setAuthMode(true);
    setAuthStatus(message || "");
  }

  function setSidebarOpen(isOpen) {
    state.isSidebarOpen = isOpen;
    appShell.classList.toggle("sidebar-open", isOpen);
    menuToggleButton.classList.toggle("is-shifted", isOpen);
    sidebarBackdrop.hidden = !isOpen;
  }

  function setMobileChatOpen(isOpen) {
    state.isMobileChatOpen = isOpen;
    appShell.classList.toggle("mobile-chat-open", isOpen);
  }

  function setChatPickerOpen(isOpen) {
    state.isChatPickerOpen = isOpen;
    if (chatPickerBackdrop) {
      chatPickerBackdrop.hidden = !isOpen;
    }
    if (isOpen) {
      renderChatPickerList();
    }
  }

  function stopActiveChatListener() {
    if (state.activeChatUnsubscribe) {
      state.activeChatUnsubscribe();
      state.activeChatUnsubscribe = null;
    }
  }

  function cleanupListeners() {
    stopActiveChatListener();
    if (state.chatsUnsubscribe) {
      state.chatsUnsubscribe();
      state.chatsUnsubscribe = null;
    }
    if (state.usersUnsubscribe) {
      state.usersUnsubscribe();
      state.usersUnsubscribe = null;
    }
    if (presenceTimer) {
      window.clearInterval(presenceTimer);
      presenceTimer = null;
    }
  }

  function getActiveChat() {
    return state.chats.find(function (chat) { return chat.id === state.activeChatId; }) || null;
  }

  function getOtherMembers(chat) {
    return (chat.memberDetails || [])
      .map(hydrateMember)
      .filter(function (member) { return member.uid !== state.currentUser.uid; });
  }

  function getOtherMember(chat) {
    return getOtherMembers(chat)[0] || null;
  }

  function getChatTitle(chat) {
    const others = getOtherMembers(chat);
    if (!others.length) return "Just you";
    return others.map(function (member) { return normalizeDisplayName(member); }).join(", ");
  }

  function getChatSubtitle(chat) {
    if (chat.status === "pending") return chat.requestedBy === state.currentUser.uid ? "Waiting for approval" : "Wants to chat with you";
    if (chat.status === "rejected") return "Request declined";
    const other = getOtherMember(chat);
    if (other && isUserLive(other)) return "Live now";
    if (other && other.banned) return "Banned account";
    return "Offline";
  }

  function getChatAvatar(chat) {
    const other = getOtherMember(chat);
    return initialsFromName(normalizeDisplayName(other || state.currentProfile));
  }

  function setCurrentUserPanel() {
    if (!state.currentProfile) return;
    currentUserName.textContent = normalizeDisplayName(state.currentProfile);
    currentUserHandle.textContent = isCreator(state.currentProfile) ? "Creator account" : "Ready to chat";
    currentUserAvatar.textContent = initialsFromName(normalizeDisplayName(state.currentProfile));
    const badgeHost = document.getElementById("currentUserBadges");
    if (badgeHost) badgeHost.innerHTML = renderBadges(state.currentProfile);
  }

  function renderCreatorControls(chat) {
    const other = chat ? getOtherMember(chat) : null;
    const canModerate = isCreator(state.currentProfile) && !!other && !isCreator(other);
    removeUserButton.hidden = !canModerate;
    banUserButton.hidden = !canModerate || !!(other && other.banned);
  }

  function renderPeopleList() {
    peopleList.innerHTML = "";
    const otherUsers = state.users.filter(function (user) {
      return user.uid !== state.currentUser.uid && !user.banned && isUserLive(user);
    }).slice(0, 10);

    if (!otherUsers.length) {
      peopleList.innerHTML = '<div class="empty-state compact">No live users right now.</div>';
      return;
    }

    otherUsers.forEach(function (user) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "story";
      button.innerHTML =
        '<span class="avatar-ring"><span class="avatar">' + escapeHtml(initialsFromName(normalizeDisplayName(user))) + '</span></span>' +
        '<span class="story-copy"><span>' + escapeHtml(normalizeDisplayName(user)) + '</span>' + renderBadges(user) + '</span>';
      button.addEventListener("click", function () {
        startDirectChat(user.uid);
        if (isMobileViewport()) setSidebarOpen(false);
      });
      peopleList.appendChild(button);
    });
  }

  function renderChatPickerList() {
    if (!chatPickerList) return;
    chatPickerList.innerHTML = "";

    const otherUsers = state.users.filter(function (user) {
      return user.uid !== state.currentUser.uid && !user.banned && isUserLive(user);
    });

    if (!otherUsers.length) {
      chatPickerList.innerHTML = '<div class="empty-state">No online users available right now.</div>';
      return;
    }

    otherUsers.forEach(function (user) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chat-picker-item";
      button.innerHTML =
        '<span class="avatar-ring"><span class="avatar">' + escapeHtml(initialsFromName(normalizeDisplayName(user))) + '</span></span>' +
        '<span class="chat-picker-copy"><strong>' + escapeHtml(normalizeDisplayName(user)) + '</strong><span>Online now</span>' + renderBadges(user) + '</span>';
      button.addEventListener("click", function () {
        setChatPickerOpen(false);
        startDirectChat(user.uid);
      });
      chatPickerList.appendChild(button);
    });
  }

  function renderThreadList() {
    threadList.innerHTML = "";
    const filtered = state.chats.filter(function (chat) {
      const haystack = (getChatTitle(chat) + " " + getChatSubtitle(chat) + " " + (chat.lastMessageText || "") + " " + (chat.status || "")).toLowerCase();
      return haystack.includes(state.filterValue);
    });

    if (!filtered.length) {
      threadList.innerHTML = '<div class="empty-state">No chats yet. Use People to start one.</div>';
      return;
    }

    filtered.forEach(function (chat) {
      const button = document.createElement("button");
      const requestBadge = chat.status === "pending" ? '<span class="thread-chip pending-chip">Request</span>' : "";
      const rejectedBadge = chat.status === "rejected" ? '<span class="thread-chip rejected-chip">Declined</span>' : "";
      const otherMember = getOtherMember(chat);
      button.type = "button";
      button.className = "thread-card" + (chat.id === state.activeChatId ? " is-active" : "");
      button.innerHTML =
        '<div class="avatar-ring"><div class="avatar">' + escapeHtml(getChatAvatar(chat)) + '</div></div>' +
        '<div class="thread-main"><h4>' + escapeHtml(getChatTitle(chat)) + renderBadges(otherMember) + '</h4><p>' + escapeHtml(chat.lastMessageText || getChatSubtitle(chat)) + '</p></div>' +
        '<div class="thread-meta"><p>' + escapeHtml(formatRelative(chat.updatedAt)) + '</p>' + requestBadge + rejectedBadge + '</div>';
      button.addEventListener("click", function () {
        selectChat(chat.id);
      });
      threadList.appendChild(button);
    });
  }

  function updateRequestPanel(chat) {
    if (!chat || chat.status === "accepted") {
      requestPanel.hidden = true;
      messageInput.disabled = false;
      return;
    }

    requestPanel.hidden = false;
    messageInput.disabled = true;
    const other = getOtherMember(chat);
    const otherName = normalizeDisplayName(other);

    if (chat.status === "pending" && chat.recipientId === state.currentUser.uid) {
      requestTitle.textContent = "Conversation request";
      requestText.textContent = otherName + " wants to start chatting with you.";
      requestActions.hidden = false;
    } else if (chat.status === "pending") {
      requestTitle.textContent = "Request sent";
      requestText.textContent = "Waiting for " + otherName + " to accept this conversation.";
      requestActions.hidden = true;
    } else {
      requestTitle.textContent = "Request declined";
      requestText.textContent = otherName + " declined this conversation request.";
      requestActions.hidden = true;
    }
  }

  function renderMessages(messages) {
    const activeChat = getActiveChat();
    if (!activeChat) {
      activeName.textContent = "No chat selected";
      activeStatus.textContent = "Pick or create a chat";
      activeAvatar.textContent = "..";
      requestPanel.hidden = true;
      messageInput.disabled = true;
      renderCreatorControls(null);
      messageList.innerHTML = '<div class="empty-state">Choose a chat to start messaging.</div>';
      return;
    }

    activeName.textContent = getChatTitle(activeChat);
    activeStatus.textContent = getChatSubtitle(activeChat);
    activeAvatar.textContent = getChatAvatar(activeChat);
    const titleBadgeHost = document.getElementById("activeUserBadges");
    if (titleBadgeHost) titleBadgeHost.innerHTML = renderBadges(getOtherMember(activeChat));
    renderCreatorControls(activeChat);
    updateRequestPanel(activeChat);
    messageList.innerHTML = "";

    if (!messages.length) {
      messageList.innerHTML = '<div class="empty-state">No messages yet.</div>';
      return;
    }

    messages.forEach(function (message) {
      const row = document.createElement("article");
      const deleteButton = message.id ? '<button class="message-delete" type="button" data-message-id="' + escapeHtml(message.id) + '" aria-label="Delete message">x</button>' : "";
      row.className = "message-row " + (message.senderId === state.currentUser.uid ? "outgoing" : "incoming");
      row.innerHTML = '<div class="message-bubble">' + deleteButton + '<div>' + escapeHtml(message.text) + '</div><div class="message-meta">' + escapeHtml(formatTime(message.createdAt)) + '</div></div>';
      messageList.appendChild(row);
    });

    messageList.scrollTop = messageList.scrollHeight;
  }

  function selectChat(chatId) {
    state.activeChatId = chatId;
    renderThreadList();
    stopActiveChatListener();
    if (isMobileViewport()) {
      setMobileChatOpen(true);
      setSidebarOpen(false);
    }

    state.activeChatUnsubscribe = db.collection("chats").doc(chatId).collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(function (snapshot) {
        const messages = snapshot.docs.map(function (item) {
          return Object.assign({ id: item.id }, item.data());
        });
        renderMessages(messages);
      });
  }

  function loadCurrentProfile(user) {
    return db.collection("users").doc(user.uid).get().then(function (snapshot) {
      state.currentProfile = snapshot.exists ? snapshot.data() : null;
      setCurrentUserPanel();
    });
  }

  function updatePresence(isOnline) {
    if (!state.currentUser) return Promise.resolve();
    return db.collection("users").doc(state.currentUser.uid).set({
      isOnline: isOnline,
      lastSeen: SERVER_TIME()
    }, { merge: true });
  }

  function startPresenceTracking() {
    updatePresence(true);
    if (presenceTimer) window.clearInterval(presenceTimer);
    presenceTimer = window.setInterval(function () {
      updatePresence(document.visibilityState === "visible");
    }, 30000);
  }

  function ensureUserProfile(user, displayNameOverride) {
    const inputName = displayNameOverride ? displayNameOverride.trim() : "";
    const existingName = user.displayName && user.displayName.trim() ? user.displayName.trim() : "";
    const userRef = db.collection("users").doc(user.uid);

    return userRef.get().then(function (snapshot) {
      const currentData = snapshot.exists ? snapshot.data() : {};
      const storedName = currentData.displayName && currentData.displayName.trim() ? currentData.displayName.trim() : "";
      const storedFullName = currentData.fullName && currentData.fullName.trim() ? currentData.fullName.trim() : "";
      const storedLooksGenerated = nameLooksLikeEmailPrefix(storedName, user.email);
      const storedFullLooksGenerated = nameLooksLikeEmailPrefix(storedFullName, user.email);
      const existingLooksGenerated = nameLooksLikeEmailPrefix(existingName, user.email);
      const finalName =
        inputName ||
        (!storedLooksGenerated && storedName) ||
        (!storedFullLooksGenerated && storedFullName) ||
        (!existingLooksGenerated && existingName) ||
        storedName ||
        storedFullName ||
        existingName ||
        "User";
      return userRef.set({
        uid: user.uid,
        displayName: finalName,
        displayNameLower: normalizeNameKey(finalName),
        fullName: finalName,
        email: user.email,
        photoInitials: initialsFromName(finalName),
        isOnline: true,
        lastSeen: SERVER_TIME(),
        createdAt: snapshot.exists ? currentData.createdAt || SERVER_TIME() : SERVER_TIME(),
        updatedAt: SERVER_TIME()
      }, { merge: true }).then(function () {
        if (!user.displayName && finalName && finalName !== "User") {
          return user.updateProfile({ displayName: finalName });
        }
        return null;
      });
    });
  }

  function validateDisplayName(displayName, currentUid) {
    const normalized = normalizeNameKey(displayName);
    if (!normalized) {
      return Promise.resolve("Please enter a valid name.");
    }
    if (RESERVED_NAMES.includes(normalized)) {
      return Promise.resolve("That name is reserved and cannot be used.");
    }
    return db.collection("users")
      .where("displayNameLower", "==", normalized)
      .limit(1)
      .get()
      .then(function (snapshot) {
        if (snapshot.empty) return "";
        const existing = snapshot.docs[0].data();
        if (existing.uid === currentUid) return "";
        return "That name is already taken. Please choose another one.";
      });
  }

  function createDirectChat(otherUser) {
    const existing = state.chats.find(function (chat) {
      return Array.isArray(chat.memberIds) && chat.memberIds.length === 2 && chat.memberIds.includes(state.currentUser.uid) && chat.memberIds.includes(otherUser.uid);
    });

    if (existing) {
      selectChat(existing.id);
      return Promise.resolve();
    }

    return db.collection("chats").add({
      memberIds: [state.currentUser.uid, otherUser.uid],
      memberDetails: [
        {
          uid: state.currentUser.uid,
          displayName: normalizeDisplayName(state.currentProfile),
          email: state.currentProfile.email,
          isOnline: true
        },
        {
          uid: otherUser.uid,
          displayName: normalizeDisplayName(otherUser),
          email: otherUser.email,
          isOnline: isUserLive(otherUser)
        }
      ],
      requestedBy: state.currentUser.uid,
      recipientId: otherUser.uid,
      status: "pending",
      lastMessageText: "Chat request sent",
      createdAt: SERVER_TIME(),
      updatedAt: SERVER_TIME()
    }).then(function (chatRef) {
      selectChat(chatRef.id);
    });
  }

  function startDirectChat(userId) {
    const otherUser = state.users.find(function (user) { return user.uid === userId; });
    if (!otherUser) return;
    createDirectChat(otherUser).catch(function (error) {
      console.error(error);
      setAuthStatus(error.message || "Could not create chat.");
    });
  }

  function startUserListener() {
    if (state.usersUnsubscribe) state.usersUnsubscribe();
    state.usersUnsubscribe = db.collection("users").onSnapshot(function (snapshot) {
      state.users = snapshot.docs.map(function (item) { return item.data(); });
      if (state.currentUser) {
        const current = getLiveUserById(state.currentUser.uid);
        if (current) {
          state.currentProfile = current;
          setCurrentUserPanel();
        }
      }
      renderPeopleList();
      renderChatPickerList();
      renderThreadList();
      const activeChat = getActiveChat();
      if (activeChat) {
        activeName.textContent = getChatTitle(activeChat);
        activeStatus.textContent = getChatSubtitle(activeChat);
        activeAvatar.textContent = getChatAvatar(activeChat);
        const titleBadgeHost = document.getElementById("activeUserBadges");
        if (titleBadgeHost) titleBadgeHost.innerHTML = renderBadges(getOtherMember(activeChat));
        renderCreatorControls(activeChat);
        updateRequestPanel(activeChat);
      }
    });
  }

  function startChatListListener() {
    if (state.chatsUnsubscribe) state.chatsUnsubscribe();
    state.chatsUnsubscribe = db.collection("chats")
      .where("memberIds", "array-contains", state.currentUser.uid)
      .onSnapshot(function (snapshot) {
        state.chats = snapshot.docs.map(function (item) {
          return Object.assign({ id: item.id }, item.data());
        }).sort(function (a, b) {
          const aSeconds = a.updatedAt && a.updatedAt.seconds ? a.updatedAt.seconds : 0;
          const bSeconds = b.updatedAt && b.updatedAt.seconds ? b.updatedAt.seconds : 0;
          return bSeconds - aSeconds;
        });

        renderThreadList();
        if (!state.activeChatId && state.chats.length) {
          if (!isMobileViewport()) {
            selectChat(state.chats[0].id);
          } else {
            renderMessages([]);
          }
          return;
        }
        if (state.activeChatId && !state.chats.find(function (chat) { return chat.id === state.activeChatId; })) {
          state.activeChatId = state.chats[0] ? state.chats[0].id : null;
          if (state.activeChatId) {
            selectChat(state.activeChatId);
          } else {
            renderMessages([]);
            setMobileChatOpen(false);
          }
        }
      });
  }

  function handleAuthSubmit(event) {
    event.preventDefault();
    if (isConfigMissing()) {
      setAuthStatus("Add your Firebase config in firebase-config.js first.");
      return;
    }

    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value.trim();
    const displayName = authNameInput.value.trim();

    if (!email || !password || (!isLoginMode && !displayName)) {
      setAuthStatus("Please complete all required fields.");
      return;
    }

    const action = isLoginMode ? auth.signInWithEmailAndPassword(email, password) : auth.createUserWithEmailAndPassword(email, password);
    action.then(function (credential) {
      if (!isLoginMode) {
        return validateDisplayName(displayName, credential.user.uid).then(function (validationError) {
          if (!validationError) return credential;
          return credential.user.delete().then(function () {
            throw new Error(validationError);
          });
        }).then(function () {
          return ensureUserProfile(credential.user, displayName);
        });
      }
      return null;
    }).then(function () {
      authNameInput.value = "";
      authEmailInput.value = "";
      authPasswordInput.value = "";
      setAuthStatus("");
    }).catch(function (error) {
      setAuthStatus(error.message || "Authentication failed.");
    });
  }

  function reauthenticateCurrentUser() {
    if (!state.currentUser || !state.currentUser.email) {
      return Promise.resolve();
    }
    const password = window.prompt("Enter your password to confirm this action:");
    if (password === null) {
      return Promise.reject(new Error("Action cancelled."));
    }
    if (!password.trim()) {
      return Promise.reject(new Error("Password is required."));
    }
    const credential = firebase.auth.EmailAuthProvider.credential(state.currentUser.email, password);
    return state.currentUser.reauthenticateWithCredential(credential);
  }

  function handleMessageSubmit(event) {
    const activeChat = getActiveChat();
    event.preventDefault();
    if (!activeChat || activeChat.status !== "accepted") return;

    const text = messageInput.value.trim();
    if (!text) return;

    db.collection("chats").doc(state.activeChatId).collection("messages").add({
      text: text,
      senderId: state.currentUser.uid,
      senderName: normalizeDisplayName(state.currentProfile),
      createdAt: SERVER_TIME()
    }).then(function () {
      return db.collection("chats").doc(state.activeChatId).update({
        lastMessageText: text,
        updatedAt: SERVER_TIME()
      });
    }).then(function () {
      messageInput.value = "";
    }).catch(function (error) {
      console.error(error);
    });
  }

  function setChatStatus(status) {
    const activeChat = getActiveChat();
    if (!activeChat) return;
    db.collection("chats").doc(activeChat.id).update({
      status: status,
      updatedAt: SERVER_TIME(),
      lastMessageText: status === "accepted" ? "Conversation accepted" : "Conversation declined"
    }).catch(function (error) {
      console.error(error);
    });
  }

  function deleteMessagesForChat(chatId) {
    return db.collection("chats").doc(chatId).collection("messages").get().then(function (snapshot) {
      if (snapshot.empty) return null;
      const batch = db.batch();
      snapshot.docs.forEach(function (messageDoc) { batch.delete(messageDoc.ref); });
      return batch.commit();
    });
  }

  function deleteChat(chatId) {
    return deleteMessagesForChat(chatId).then(function () {
      return db.collection("chats").doc(chatId).delete();
    });
  }

  function deleteChatsForUser(targetUid) {
    return db.collection("chats")
      .where("memberIds", "array-contains", targetUid)
      .get()
      .then(function (snapshot) {
        return Promise.all(snapshot.docs.map(function (doc) {
          return deleteChat(doc.id);
        }));
      });
  }

  function handleDeleteMessage(messageId) {
    const activeChat = getActiveChat();
    if (!activeChat || !messageId) return;
    if (!window.confirm("Delete this message?")) return;
    db.collection("chats").doc(activeChat.id).collection("messages").doc(messageId).delete().catch(function (error) {
      console.error(error);
    });
  }

  function handleDeleteCurrentChat() {
    const activeChat = getActiveChat();
    if (!activeChat) return;
    if (!window.confirm("Delete this chat for everyone?")) return;
    deleteChat(activeChat.id).catch(function (error) { console.error(error); });
  }

  function handleClearAllChats() {
    if (!state.chats.length) return;
    if (!window.confirm("Delete all of your chats?")) return;
    Promise.all(state.chats.map(function (chat) { return deleteChat(chat.id); })).catch(function (error) {
      console.error(error);
    });
  }

  function handleDeleteAccount() {
    if (!state.currentUser) return;
    if (!window.confirm("Delete your account permanently? This will remove your chats and you will need to sign up again.")) return;

    const uid = state.currentUser.uid;
    const accountEmail = state.currentUser.email;
    state.isDeletingAccount = true;
    reauthenticateCurrentUser().then(function () {
      return deleteChatsForUser(uid);
    }).then(function () {
      return db.collection("users").doc(uid).set({
        isOnline: false,
        lastSeen: SERVER_TIME()
      }, { merge: true });
    }).then(function () {
      return db.collection("users").doc(uid).delete();
    }).then(function () {
      return state.currentUser.delete();
    }).then(function () {
      authNotice = "Account deleted. Sign up again to return.";
      resetToAuthScreen("Account deleted for " + accountEmail + ". Sign up again to return.");
      if (auth) {
        return auth.signOut().catch(function () {
          return null;
        });
      }
      return null;
    }).catch(function (error) {
      state.isDeletingAccount = false;
      console.error(error);
      if (error && error.message === "Action cancelled.") {
        return;
      }
      setAuthStatus(error.message || "Could not delete account.");
    });
  }

  function handleCreatorRemoveUser() {
    const activeChat = getActiveChat();
    const other = activeChat ? getOtherMember(activeChat) : null;
    if (!activeChat || !other || !isCreator(state.currentProfile)) return;
    if (!window.confirm("Remove this user from the current chat?")) return;
    deleteChat(activeChat.id).catch(function (error) {
      console.error(error);
    });
  }

  function handleCreatorBanUser() {
    const activeChat = getActiveChat();
    const other = activeChat ? getOtherMember(activeChat) : null;
    if (!other || !isCreator(state.currentProfile)) return;
    if (!window.confirm("Ban this user from the app and remove their chats?")) return;
    db.collection("users").doc(other.uid).set({
      banned: true,
      bannedAt: SERVER_TIME(),
      bannedBy: state.currentUser.uid,
      isOnline: false,
      lastSeen: SERVER_TIME()
    }, { merge: true }).then(function () {
      return deleteChatsForUser(other.uid);
    }).catch(function (error) {
      console.error(error);
    });
  }

  function initFirebase() {
    if (isFileProtocol()) {
      setupBanner.hidden = false;
      setupBanner.textContent = "Open this app through http://localhost, not file://. Firebase Auth will not work from a local file.";
      setAuthenticatedUi(false);
      return;
    }
    if (isConfigMissing()) {
      setupBanner.hidden = false;
      setAuthenticatedUi(false);
      return;
    }

    try {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
    } catch (error) {
      console.error(error);
      setupBanner.hidden = false;
      setAuthStatus("Firebase failed to initialize.");
      return;
    }

    auth.onAuthStateChanged(function (user) {
      cleanupListeners();
      if (state.isDeletingAccount && !user) {
        state.isDeletingAccount = false;
      }
      if (!user) {
        state.currentUser = null;
        state.currentProfile = null;
        state.chats = [];
        state.users = [];
        state.activeChatId = null;
        setAuthenticatedUi(false);
        setMobileChatOpen(false);
        if (authNotice) {
          setAuthStatus(authNotice);
          authNotice = "";
        }
        return;
      }

      if (state.isDeletingAccount) {
        return;
      }

      state.currentUser = user;
      ensureUserProfile(user)
        .then(function () { return loadCurrentProfile(user); })
        .then(function () {
          if (state.currentProfile && state.currentProfile.banned) {
            authNotice = "This account has been banned by the creator.";
            return updatePresence(false).finally(function () {
              return auth.signOut();
            });
          }
          setAuthenticatedUi(true);
          startPresenceTracking();
          startUserListener();
          startChatListListener();
        })
        .catch(function (error) {
          console.error(error);
        });
    });
  }

  authToggleButton.addEventListener("click", function () {
    setAuthMode(!isLoginMode);
  });
  document.getElementById("authForm").addEventListener("submit", handleAuthSubmit);
  messageForm.addEventListener("submit", handleMessageSubmit);
  searchInput.addEventListener("input", function (event) {
    state.filterValue = event.target.value.trim().toLowerCase();
    renderThreadList();
  });
  messageList.addEventListener("click", function (event) {
    const deleteButton = event.target.closest(".message-delete");
    if (!deleteButton) return;
    handleDeleteMessage(deleteButton.getAttribute("data-message-id"));
  });
  newChatButton.addEventListener("click", function () {
    setChatPickerOpen(true);
  });
  openPickerButton.addEventListener("click", function () {
    setChatPickerOpen(true);
  });
  menuToggleButton.addEventListener("click", function () { setSidebarOpen(!state.isSidebarOpen); });
  sidebarBackdrop.addEventListener("click", function () { setSidebarOpen(false); });
  chatPickerBackdrop.addEventListener("click", function (event) {
    if (event.target === chatPickerBackdrop) {
      setChatPickerOpen(false);
    }
  });
  closeChatPickerButton.addEventListener("click", function () { setChatPickerOpen(false); });
  mobileBackButton.addEventListener("click", function () { setMobileChatOpen(false); });
  logoutButton.addEventListener("click", function () {
    updatePresence(false).finally(function () {
      if (auth) auth.signOut();
    });
  });
  deleteAccountButton.addEventListener("click", handleDeleteAccount);
  removeUserButton.addEventListener("click", handleCreatorRemoveUser);
  banUserButton.addEventListener("click", handleCreatorBanUser);
  acceptRequestButton.addEventListener("click", function () { setChatStatus("accepted"); });
  rejectRequestButton.addEventListener("click", function () { setChatStatus("rejected"); });
  deleteChatButton.addEventListener("click", handleDeleteCurrentChat);
  clearChatsButton.addEventListener("click", handleClearAllChats);
  window.addEventListener("beforeunload", function () {
    if (state.currentUser) updatePresence(false);
  });
  document.addEventListener("visibilitychange", function () {
    tryPlayConversationVideo();
    if (!state.currentUser) return;
    updatePresence(document.visibilityState === "visible");
  });
  window.addEventListener("resize", function () {
    if (!isMobileViewport()) {
      setMobileChatOpen(false);
      setSidebarOpen(false);
    }
  });

  setAuthMode(true);
  if (conversationVideo) {
    conversationVideo.addEventListener("loadeddata", tryPlayConversationVideo);
    conversationVideo.addEventListener("canplay", tryPlayConversationVideo);
    conversationVideo.addEventListener("pause", function () {
      if (document.visibilityState === "visible") {
        tryPlayConversationVideo();
      }
    });
    tryPlayConversationVideo();
  }
  initFirebase();
})();
