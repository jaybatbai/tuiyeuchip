// =========================================================================
// CẤU HÌNH FIREBASE CỦA BẠN
// =========================================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDhUJrWUKBCX7FRyfdmcnfc8uZ5SYGN5o4",
  authDomain: "tuiyeuchip-b8f34.firebaseapp.com",
  projectId: "tuiyeuchip-b8f34",
  storageBucket: "tuiyeuchip-b8f34.firebasestorage.app",
  messagingSenderId: "284496897502",
  appId: "1:284496897502:web:27386811c0cb947a35294f",
  measurementId: "G-T145CVEHQC"
};

const FIRESTORE_DOC_PATH = "scrapbooks/main_scrapbook";

// =========================================================================
// HÀM TIỆN ÍCH XỬ LÝ NGÀY GIỜ CHUẨN VIỆT NAM
// =========================================================================
function parseDateVN(dateStr) {
  if (!dateStr) return null;
  const clean = String(dateStr).trim();

  const vnMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (vnMatch) {
    const day = parseInt(vnMatch[1], 10);
    const month = parseInt(vnMatch[2], 10) - 1;
    const year = parseInt(vnMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const compactMatch = clean.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (compactMatch) {
    const day = parseInt(compactMatch[1], 10);
    const month = parseInt(compactMatch[2], 10) - 1;
    const year = parseInt(compactMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const isoMatch = clean.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function formatDateVN(dateInput) {
  if (!dateInput) return "";
  const d = dateInput instanceof Date ? dateInput : parseDateVN(dateInput);
  if (!d || isNaN(d.getTime())) return String(dateInput);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getTodayVN() {
  return formatDateVN(new Date());
}

function getNowDateTimeVN() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${min} - ${formatDateVN(now)}`;
}

// =========================================================================
// HỘP THOẠI NHẬP LIỆU TÙY CHỈNH (KHÔNG BỊ ĐÓNG KHI CHUYỂN TAB COPY/PASTE)
// =========================================================================
let customDialogResolve = null;

function ensureCustomDialogDOM() {
  if (document.getElementById("custom-prompt-modal")) return;

  const modalHtml = `
    <div id="custom-prompt-modal" class="hidden fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-pink-100 animate-pop-in">
        <div class="flex items-center justify-between gap-2 mb-2">
          <h3 id="custom-prompt-title" class="font-bold text-base sm:text-lg text-gray-800"></h3>
          <button type="button" onclick="closeCustomDialog(null)" class="p-1.5 rounded-full text-gray-400 hover:bg-pink-50 hover:text-pink-500 transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <p id="custom-prompt-desc" class="text-xs text-gray-500 mb-3 leading-relaxed"></p>

        <div id="custom-prompt-group-wrap" class="hidden mb-3">
          <label class="block text-[11px] font-bold text-pink-600 mb-1">Phân loại nhóm:</label>
          <select id="custom-prompt-group-select" class="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm bg-pink-50/50 text-gray-700 focus:outline-none focus:border-pink-500"></select>
        </div>

        <input
          type="text"
          id="custom-prompt-input"
          class="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-sm text-gray-800 focus:outline-none focus:border-pink-500 mb-4"
          placeholder="Nhập hoặc dán nội dung vào đây..."
          onkeydown="if(event.key==='Enter') submitCustomDialog(); if(event.key==='Escape') closeCustomDialog(null);"
        />

        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            onclick="closeCustomDialog(null)"
            class="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onclick="submitCustomDialog()"
            class="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-sm transition"
          >
            Lưu Lại ✨
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  lucide.createIcons();
}

function openCustomDialog({
  title = "Nhập thông tin",
  desc = "",
  defaultValue = "",
  placeholder = "Nhập hoặc dán nội dung vào đây...",
  groups = null,
  selectedGroup = ""
}) {
  ensureCustomDialogDOM();

  return new Promise((resolve) => {
    customDialogResolve = resolve;

    const modal = document.getElementById("custom-prompt-modal");
    const titleEl = document.getElementById("custom-prompt-title");
    const descEl = document.getElementById("custom-prompt-desc");
    const inputEl = document.getElementById("custom-prompt-input");
    const groupWrap = document.getElementById("custom-prompt-group-wrap");
    const groupSelect = document.getElementById("custom-prompt-group-select");

    titleEl.textContent = title;
    descEl.textContent = desc;
    descEl.classList.toggle("hidden", !desc);

    inputEl.value = defaultValue;
    inputEl.placeholder = placeholder;

    if (Array.isArray(groups) && groups.length > 0) {
      groupWrap.classList.remove("hidden");
      groupSelect.innerHTML =
        `<option value="">Nhóm: Chung (Không phân nhóm)</option>` +
        groups
          .map(
            (g) =>
              `<option value="${escapeHtml(g)}" ${g === selectedGroup ? "selected" : ""}>${escapeHtml(g)}</option>`
          )
          .join("");
    } else {
      groupWrap.classList.add("hidden");
      groupSelect.innerHTML = "";
    }

    modal.classList.remove("hidden");
    lucide.createIcons();
    setTimeout(() => {
      inputEl.focus();
      inputEl.select();
    }, 30);
  });
}

function submitCustomDialog() {
  const inputEl = document.getElementById("custom-prompt-input");
  const groupWrap = document.getElementById("custom-prompt-group-wrap");
  const groupSelect = document.getElementById("custom-prompt-group-select");

  const result = {
    text: inputEl ? inputEl.value : "",
    group: !groupWrap.classList.contains("hidden") && groupSelect ? groupSelect.value : ""
  };
  closeCustomDialog(result);
}

function closeCustomDialog(result) {
  const modal = document.getElementById("custom-prompt-modal");
  if (modal) modal.classList.add("hidden");
  if (customDialogResolve) {
    const fn = customDialogResolve;
    customDialogResolve = null;
    fn(result);
  }
}

// =========================================================================
// DỮ LIỆU MẶC ĐỊNH BAN ĐẦU
// =========================================================================
const DEFAULT_TOPICS = [
  {
    id: "topic_nicknames",
    name: "Tên gọi & Biệt danh",
    icon: "🏷️",
    groups: [],
    items: [
      "Chip (tên gọi thân thương nhất của anh)",
      "Em bé mỗi khi làm nũng hoặc buồn ngủ",
      "Công chúa nhỏ của riêng anh"
    ]
  },
  {
    id: "topic_food",
    name: "Sở thích ăn uống",
    icon: "🍜",
    groups: ["🧋 Đồ uống", "🍿 Đồ ăn vặt", "🍚 Món chính"],
    items: [
      { text: "Trà sữa ít đường, nhiều trân châu", group: "🧋 Đồ uống" },
      { text: "Đồ ăn vặt chua ngọt và các món có phô mai", group: "🍿 Đồ ăn vặt" },
      { text: "Không thích ăn hành lá và đồ quá cay", group: "🍚 Món chính" }
    ]
  },
  {
    id: "topic_hobbies",
    name: "Thú vui & Thói quen",
    icon: "🎨",
    groups: [],
    items: [
      "Thích đi dạo hóng gió buổi tối",
      "Hay cười tít mắt khi gặp chuyện vui",
      "Thích được xoa đầu mỗi khi mệt mỏi"
    ]
  }
];

const DEFAULT_COUPONS = [
  {
    id: "cp_1",
    icon: "🧋",
    title: "1 Ly Trà Sữa Cấp Tốc",
    desc: "Ship tận nơi bất kể nắng mưa hay giờ giấc",
    used: false,
    usedAt: ""
  },
  {
    id: "cp_2",
    icon: "👑",
    title: "1 Phiếu Miễn Giận Dỗi",
    desc: "Dùng để anh phải dỗ dành và chiều em vô điều kiện",
    used: false,
    usedAt: ""
  },
  {
    id: "cp_3",
    icon: "🛵",
    title: "1 Chuyến Vi Vu Hóng Gió",
    desc: "Anh làm tài xế đưa em đi bất cứ đâu em thích",
    used: false,
    usedAt: ""
  },
  {
    id: "cp_4",
    icon: "🫂",
    title: "100 Cái Ôm Sạc Pin",
    desc: "Kích hoạt ngay mỗi khi em thấy mệt mỏi hoặc áp lực",
    used: false,
    usedAt: ""
  }
];

const DEFAULT_PLAYLIST = [
  {
    id: "song_default_1",
    title: "Giai điệu nhẹ nhàng cho góc nhỏ của tụi mình",
    artist: "",
    type: "youtube",
    youtubeId: "jfKfPfyJRdk",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk"
  }
];

const DEFAULT_DATA = {
  profile: {
    badge: "✨ Sổ Tay Bí Mật Dành Riêng Cho Em ✨",
    title: "Góc Nhỏ Về Chip 💖",
    subtitle: "Nơi lưu giữ những điều đáng yêu nhất về em mỗi ngày",
    startDate: "01/01/2025",
    eventName: "Kỷ niệm đặc biệt ✨",
    eventDate: "01/01/2027",
    adminPassword: "1234",
    musicTitle: "Góc Nhạc Của Tụi Mình",
    musicSubtitle: "Nhạc của tụi mình 🎵"
  },
  letter: {
    body: "Gửi Chip,\n\nAnh làm góc nhỏ này để mỗi khi em thấy mệt mỏi hay buồn chán, em có thể mở ra và thấy mình được yêu thương nhiều đến nhường nào.\n\nAnh không giỏi thể hiện tình cảm bằng lời nói, mong những thứ nhỏ bé này sẽ giúp em cảm nhận được tình cảm của anh.\n\nCảm ơn em vì đã luôn ở bên cạnh và làm cho những ngày bình thường của anh trở nên đặc biệt hơn bao giờ hết!",
    sign: "— Thương em thật nhiều ❤️"
  },
  topics: DEFAULT_TOPICS,
  pokemonCards: [],
  coupons: DEFAULT_COUPONS,
  memories: [
    {
      id: "m1",
      title: "Nụ cười làm anh đổ gục từ lần đầu",
      date: "01/01/2025",
      tag: "Kỷ niệm của tụi mình",
      sticker: "💖",
      image: "",
      note: "Hôm đó trời hơi se lạnh, nhưng chỉ cần nhìn thấy em cười là anh thấy ấm áp cả một ngày dài.",
      gfReaction: "",
      gfReply: ""
    },
    {
      id: "m2",
      title: "Mỗi lần em tập trung ăn món ngon",
      date: "14/02/2025",
      tag: "Thói quen đáng yêu",
      sticker: "🍓",
      image: "",
      note: "Mắt em sáng rực lên mỗi khi đồ ăn được bưng ra, nhìn cưng không chịu được!",
      gfReaction: "",
      gfReply: ""
    }
  ],
  playlist: DEFAULT_PLAYLIST,
  notifications: []
};

// =========================================================================
// TRẠNG THÁI CHUNG CỦA ỨNG DỤNG
// =========================================================================
let appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
let userRole = null; // null | 'gf' | 'admin'
let isAdminPreviewingGf = false;
let db = null;

// =========================================================================
// KHỞI TẠO & KẾT NỐI FIREBASE CLOUD
// =========================================================================
function initApp() {
  lucide.createIcons();
  ensureCustomDialogDOM();
  createFloatingHearts();
  setupPasscodeSlots();

  if (typeof renderStickerPicker === "function") renderStickerPicker();
  if (typeof renderTopicIconPicker === "function") renderTopicIconPicker();
  if (typeof renderCouponIconPicker === "function") renderCouponIconPicker();
  if (typeof initMusicPlayer === "function") initMusicPlayer();

  try {
    if (FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes("YOUR_")) {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      listenToCloudData();
    } else {
      setCloudStatus(false, "Chế độ Offline (Local)");
      loadLocalFallback();
    }
  } catch (err) {
    console.error("Firebase init error:", err);
    setCloudStatus(false, "Lỗi kết nối Cloud");
    loadLocalFallback();
  }
}

function setCloudStatus(connected, text) {
  const dot = document.getElementById("cloud-dot");
  const label = document.getElementById("cloud-text");
  if (!dot || !label) return;
  label.textContent = text;
  dot.className = connected
    ? "w-2 h-2 rounded-full bg-emerald-500"
    : "w-2 h-2 rounded-full bg-amber-400";
}

function listenToCloudData() {
  const docRef = db.doc(FIRESTORE_DOC_PATH);
  docRef.onSnapshot(
    (docSnap) => {
      setCloudStatus(true, "Đã kết nối Cloud ✨");
      if (docSnap.exists) {
        const remote = docSnap.data();
        appData = {
          profile: { ...DEFAULT_DATA.profile, ...(remote.profile || {}) },
          letter: { ...DEFAULT_DATA.letter, ...(remote.letter || {}) },
          topics: Array.isArray(remote.topics) ? remote.topics : DEFAULT_TOPICS,
          pokemonCards: Array.isArray(remote.pokemonCards) ? remote.pokemonCards : [],
          coupons: Array.isArray(remote.coupons) ? remote.coupons : DEFAULT_COUPONS,
          memories: Array.isArray(remote.memories) ? remote.memories : DEFAULT_DATA.memories,
          playlist: Array.isArray(remote.playlist) ? remote.playlist : DEFAULT_PLAYLIST,
          notifications: Array.isArray(remote.notifications) ? remote.notifications : []
        };
      } else {
        saveAppData();
      }
      refreshAllUI();
    },
    (error) => {
      console.error("Firestore read error:", error);
      setCloudStatus(false, "Chưa bật Firestore Rules");
      loadLocalFallback();
    }
  );
}

function loadLocalFallback() {
  const saved = localStorage.getItem("love_scrapbook_fallback");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appData = {
        ...DEFAULT_DATA,
        ...parsed,
        profile: { ...DEFAULT_DATA.profile, ...(parsed.profile || {}) },
        topics: Array.isArray(parsed.topics) ? parsed.topics : DEFAULT_TOPICS,
        pokemonCards: Array.isArray(parsed.pokemonCards) ? parsed.pokemonCards : [],
        coupons: Array.isArray(parsed.coupons) ? parsed.coupons : DEFAULT_COUPONS,
        playlist: Array.isArray(parsed.playlist) ? parsed.playlist : DEFAULT_PLAYLIST,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : []
      };
    } catch (e) {}
  }
  refreshAllUI();
}

async function saveAppData() {
  const serialized = JSON.stringify(appData);
  if (serialized.length > 950000) {
    alert("Dung lượng dữ liệu (ảnh) đã chạm giới hạn lưu trữ đám mây (1MB). Anh hãy xóa bớt ảnh cũ trên thẻ kỷ niệm trước khi lưu thêm nhé!");
    return false;
  }

  localStorage.setItem("love_scrapbook_fallback", serialized);

  if (db) {
    try {
      setCloudStatus(true, "Đang đồng bộ...");
      await db.doc(FIRESTORE_DOC_PATH).set(appData);
      setCloudStatus(true, "Đã lưu lên Cloud ✨");
    } catch (err) {
      console.error("Save error:", err);
      alert("Không thể lưu lên Cloud! Hãy kiểm tra lại tab Rules trong Firestore Database.");
      setCloudStatus(false, "Lỗi lưu Cloud");
      return false;
    }
  }
  refreshAllUI();
  return true;
}

// =========================================================================
// NHẬT KÝ HOẠT ĐỘNG CỦA EM (NOTIFICATIONS CHO ADMIN)
// =========================================================================
function pushGfActivity(type, text) {
  appData.notifications = Array.isArray(appData.notifications) ? appData.notifications : [];
  appData.notifications.unshift({
    id: "ntf_" + Date.now(),
    type,
    text,
    time: getNowDateTimeVN(),
    read: false
  });
  if (appData.notifications.length > 30) {
    appData.notifications = appData.notifications.slice(0, 30);
  }
}

function toggleNotificationsDrawer() {
  const drawer = document.getElementById("admin-notif-drawer");
  if (!drawer) return;
  drawer.classList.toggle("hidden");
  renderAdminNotifications();
}

async function markAllNotificationsRead() {
  if (!Array.isArray(appData.notifications)) return;
  appData.notifications.forEach((n) => {
    n.read = true;
  });
  await saveAppData();
}

function renderAdminNotifications() {
  const badge = document.getElementById("admin-notif-badge");
  const list = document.getElementById("admin-notif-list");
  if (!badge || !list) return;

  const items = appData.notifications || [];
  const unreadCount = items.filter((n) => !n.read).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }

  if (items.length === 0) {
    list.innerHTML = `<p class="text-xs text-gray-400 italic">Chưa có tương tác nào mới từ em.</p>`;
    return;
  }

  list.innerHTML = items
    .map(
      (n) => `
      <div class="p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 ${
        n.read ? "bg-white/70 border-rose-100 text-gray-600" : "bg-white border-rose-300 text-gray-800 font-semibold shadow-xs"
      }">
        <div>
          <div>${escapeHtml(n.text)}</div>
          <div class="text-[10px] text-rose-400 font-normal mt-0.5">${escapeHtml(n.time)}</div>
        </div>
        ${!n.read ? `<span class="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold shrink-0">Mới</span>` : ""}
      </div>
    `
    )
    .join("");
}

// =========================================================================
// PHONG BÌ NIÊM PHONG & 8 Ô NHẬP SỐ (GATE SCREEN)
// =========================================================================
function setupPasscodeSlots() {
  const slots = Array.from(document.querySelectorAll(".passcode-digit"));
  if (slots.length === 0) return;

  slots.forEach((slot, idx) => {
    slot.addEventListener("input", () => {
      const clean = slot.value.replace(/[^a-zA-Z0-9]/g, "");
      slot.value = clean.slice(-1);

      if (slot.value && idx < slots.length - 1) {
        slots[idx + 1].focus();
      }

      const currentCode = getPasscodeValue();
      const adminPass = String(appData.profile.adminPassword || "1234").trim();
      if (currentCode === adminPass || currentCode.length === slots.length) {
        unlockGate();
      }
    });

    slot.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !slot.value && idx > 0) {
        slots[idx - 1].value = "";
        slots[idx - 1].focus();
      } else if (e.key === "ArrowLeft" && idx > 0) {
        slots[idx - 1].focus();
      } else if (e.key === "ArrowRight" && idx < slots.length - 1) {
        slots[idx + 1].focus();
      } else if (e.key === "Enter") {
        unlockGate();
      }
    });

    slot.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData("text")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, slots.length);
      if (!pasted) return;

      slots.forEach((s, i) => {
        s.value = pasted[i] || "";
      });

      const nextFocus = Math.min(pasted.length, slots.length - 1);
      slots[nextFocus].focus();

      if (pasted.length === slots.length || pasted === String(appData.profile.adminPassword || "1234").trim()) {
        unlockGate();
      }
    });
  });
}

function getPasscodeValue() {
  return Array.from(document.querySelectorAll(".passcode-digit"))
    .map((s) => s.value.trim())
    .join("");
}

function clearPasscodeSlots() {
  const slots = document.querySelectorAll(".passcode-digit");
  slots.forEach((s) => {
    s.value = "";
    s.classList.remove("border-rose-400");
  });
  if (slots[0]) slots[0].focus();
}

function isEditingAllowed() {
  return userRole === "admin" && !isAdminPreviewingGf;
}

function unlockGate() {
  const slots = document.querySelectorAll(".passcode-digit");
  const errorEl = document.getElementById("gate-error-msg");
  const rawInput = getPasscodeValue();

  if (!rawInput) return;

  const adminPass = String(appData.profile.adminPassword || "1234").trim();
  if (rawInput === adminPass) {
    userRole = "admin";
    isAdminPreviewingGf = false;
    enterApp();
    return;
  }

  const savedStartDate = parseDateVN(appData.profile.startDate);
  const inputStartDate = parseDateVN(rawInput);

  if (
    savedStartDate &&
    inputStartDate &&
    savedStartDate.getDate() === inputStartDate.getDate() &&
    savedStartDate.getMonth() === inputStartDate.getMonth() &&
    savedStartDate.getFullYear() === inputStartDate.getFullYear()
  ) {
    userRole = "gf";
    isAdminPreviewingGf = false;
    enterApp();
    return;
  }

  errorEl.classList.remove("hidden");
  slots.forEach((s) => s.classList.add("border-rose-400"));
}

function enterApp() {
  document.getElementById("gate-error-msg").classList.add("hidden");
  document.querySelectorAll(".passcode-digit").forEach((s) => s.classList.remove("border-rose-400"));
  document.getElementById("gate-screen").classList.add("hidden");
  document.getElementById("main-app-wrapper").classList.remove("hidden");

  triggerHeartConfetti();
  applyRoleVisibility();
  refreshAllUI();

  if (userRole === "gf" && typeof startMusicOnUnlock === "function") {
    startMusicOnUnlock();
  }
}

function lockGate() {
  userRole = null;
  isAdminPreviewingGf = false;
  if (typeof pauseMusic === "function") pauseMusic();
  document.getElementById("gate-error-msg").classList.add("hidden");
  document.getElementById("main-app-wrapper").classList.add("hidden");
  document.getElementById("gate-screen").classList.remove("hidden");
  clearPasscodeSlots();
  lucide.createIcons();
}

function toggleAdminPreview() {
  if (userRole !== "admin") return;
  isAdminPreviewingGf = !isAdminPreviewingGf;
  applyRoleVisibility();
  refreshAllUI();
}

function applyRoleVisibility() {
  const adminNav = document.getElementById("admin-top-nav");
  const adminControls = document.querySelectorAll(".admin-control");
  const previewBtn = document.getElementById("btn-preview-gf");

  if (userRole === "admin") {
    adminNav.classList.remove("hidden");
    if (isAdminPreviewingGf) {
      adminControls.forEach((el) => el.classList.add("hidden"));
      document.getElementById("admin-manage-drawer").classList.add("hidden");
      document.getElementById("admin-notif-drawer").classList.add("hidden");
      previewBtn.innerHTML = `<i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Quay Lại Bảng Điều Khiển`;
      previewBtn.className = "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-pink-500 text-white shadow-sm flex items-center gap-1.5";
    } else {
      adminControls.forEach((el) => el.classList.remove("hidden"));
      previewBtn.innerHTML = `<i data-lucide="eye" class="w-3.5 h-3.5"></i> Xem Thử Giao Diện Của Em`;
      previewBtn.className = "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-pink-100 text-pink-700 hover:bg-pink-200 flex items-center gap-1.5";
    }
  } else {
    adminNav.classList.add("hidden");
    adminControls.forEach((el) => el.classList.add("hidden"));
  }
  lucide.createIcons();
}

// =========================================================================
// ĐIỀU PHỐI RENDER TOÀN TRANG
// =========================================================================
function refreshAllUI() {
  if (typeof renderProfile === "function") renderProfile();
  if (typeof renderLetter === "function") renderLetter();
  if (typeof renderTopicsSection === "function") renderTopicsSection();
  if (typeof renderBinderSection === "function") renderBinderSection();
  if (typeof renderCouponsSection === "function") renderCouponsSection();
  if (typeof updateMysteryDeckStats === "function") updateMysteryDeckStats();
  if (typeof renderAdminManageList === "function") renderAdminManageList();
  if (typeof syncMusicPlaylistUI === "function") syncMusicPlaylistUI();
  if (typeof renderBookToc === "function") renderBookToc();
  renderAdminNotifications();
  lucide.createIcons();
}

// =========================================================================
// HIỆU ỨNG TRANG TRÍ & TIỆN ÍCH CHUNG
// =========================================================================
function createFloatingHearts() {
  const container = document.getElementById("hearts-container");
  if (!container) return;
  const symbols = ["♥", "♡", "✿", "✦"];
  for (let i = 0; i < 16; i++) {
    const el = document.createElement("div");
    el.className = "floating-heart";
    el.textContent = symbols[i % symbols.length];
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 14 + Math.random() * 16 + "px";
    el.style.animationDuration = 10 + Math.random() * 14 + "s";
    el.style.animationDelay = Math.random() * 10 + "s";
    container.appendChild(el);
  }
}

function triggerHeartConfetti() {
  if (typeof confetti !== "function") return;
  confetti({
    particleCount: 45,
    spread: 65,
    origin: { y: 0.7 },
    colors: ["#ff6b9d", "#ff9ebb", "#ffc2d6", "#ff477e", "#ffd166"]
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

window.addEventListener("DOMContentLoaded", initApp);
