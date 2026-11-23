// =========================================================================
// CẤU HÌNH FIREBASE CỦA BẠN (ĐÃ GẮN SẴN)
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
// HÀM TIỆN ÍCH XỬ LÝ NGÀY CHUẨN DD/MM/YYYY
// =========================================================================
function parseDateVN(dateStr) {
  if (!dateStr) return null;
  const clean = String(dateStr).trim();

  // Định dạng dd/mm/yyyy hoặc dd-mm-yyyy hoặc dd.mm.yyyy
  const vnMatch = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (vnMatch) {
    const day = parseInt(vnMatch[1], 10);
    const month = parseInt(vnMatch[2], 10) - 1;
    const year = parseInt(vnMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Định dạng viết liền ddmmyyyy (VD: 15082026)
  const compactMatch = clean.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (compactMatch) {
    const day = parseInt(compactMatch[1], 10);
    const month = parseInt(compactMatch[2], 10) - 1;
    const year = parseInt(compactMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Định dạng ISO yyyy-mm-dd (tương thích dữ liệu cũ đã lưu)
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

// =========================================================================
// HỘP THOẠI NHẬP LIỆU TÙY CHỈNH (KHÔNG BỊ TỰ ĐÓNG KHI CHUYỂN TAB COPY/PASTE)
// =========================================================================
let customDialogResolve = null;

function ensureCustomDialogDOM() {
  if (document.getElementById("custom-prompt-modal")) return;

  const modalHtml = `
    <div id="custom-prompt-modal" class="hidden fixed inset-0 z-[100] bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
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
const STICKERS = ["💖", "🥰", "🍓", "🧸", "🧋", "🌸", "✨", "🎀", "🐱", "🍰", "🌙", "💌"];
const TOPIC_ICONS = ["🏷️", "🍜", "🧋", "🎮", "🎨", "🎵", "💤", "🚫", "🌸", "🧸", "✨", "💬"];
const COUPON_ICONS = ["🧋", "🎟️", "💆‍♀️", "🛵", "🍦", "🎬", "🧸", "💐", "🫂", "👑"];

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

const DEFAULT_DATA = {
  profile: {
    title: "Góc Nhỏ Về Chip 💖",
    subtitle: "Nơi lưu giữ những điều đáng yêu nhất về em mỗi ngày",
    startDate: "01/01/2025",
    eventName: "Kỷ niệm đặc biệt ✨",
    eventDate: "01/01/2027",
    adminPassword: "1234"
  },
  letter: {
    body: "Gửi Chip,\n\nAnh làm góc nhỏ này để mỗi khi em thấy mệt mỏi hay buồn chán, em có thể mở ra và thấy mình được yêu thương nhiều đến nhường nào.\n\nAnh không giỏi thể hiện tình cảm bằng lời nói, mong những thứ nhỏ bé này sẽ giúp em cảm nhận được tình cảm của anh.\n\nCảm ơn em vì đã luôn ở bên cạnh và làm cho những ngày bình thường của anh trở nên đặc biệt hơn bao giờ hết!",
    sign: "— Thương em thật nhiều ❤️"
  },
  topics: DEFAULT_TOPICS,
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
  ]
};

// =========================================================================
// TRẠNG THÁI ỨNG DỤNG
// =========================================================================
let appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
let userRole = null; // null (chưa mở phong bì) | 'gf' (của em) | 'admin' (của anh)
let isAdminPreviewingGf = false;
let db = null;

// Mystery deck state
let unseenIds = [];
let currentRevealedId = null;
let selectedSticker = "💖";
let uploadedImageBase64 = "";

// Topics & Coupons state
let activeTopicId = "topic_nicknames";
let selectedTopicIcon = "🏷️";
let selectedCouponIcon = "🧋";
let expandedTopicIds = new Set(); // Lưu các mục đang bấm "Xem thêm"
let topicSearchQuery = "";        // Từ khóa lọc nhanh trong mục hiện tại
let selectedNewItemGroup = "";    // Nhóm đang chọn khi thêm dòng mới
const TOPIC_COLLAPSE_LIMIT = 6;   // Số chẵn (6 ô = 3 hàng x 2 cột) để không bị lẻ

// =========================================================================
// KHỞI TẠO & KẾT NỐI FIREBASE CLOUD
// =========================================================================
function initApp() {
  lucide.createIcons();
  ensureCustomDialogDOM();
  createFloatingHearts();
  setupPasscodeSlots();
  renderStickerPicker();
  renderTopicIconPicker();
  renderCouponIconPicker();

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
          coupons: Array.isArray(remote.coupons) ? remote.coupons : DEFAULT_COUPONS,
          memories: Array.isArray(remote.memories) ? remote.memories : DEFAULT_DATA.memories
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
        coupons: Array.isArray(parsed.coupons) ? parsed.coupons : DEFAULT_COUPONS
      };
    } catch (e) {}
  }
  refreshAllUI();
}

async function saveAppData() {
  localStorage.setItem("love_scrapbook_fallback", JSON.stringify(appData));

  if (db) {
    try {
      setCloudStatus(true, "Đang đồng bộ...");
      await db.doc(FIRESTORE_DOC_PATH).set(appData);
      setCloudStatus(true, "Đã lưu lên Cloud ✨");
    } catch (err) {
      console.error("Save error:", err);
      alert("Không thể lưu lên Cloud! Hãy kiểm tra lại tab Rules trong Firestore Database của bạn.");
      setCloudStatus(false, "Lỗi lưu Cloud");
    }
  }
  refreshAllUI();
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

  // 1. Kiểm tra mật khẩu riêng của anh (Admin)
  const adminPass = String(appData.profile.adminPassword || "1234").trim();
  if (rawInput === adminPass) {
    userRole = "admin";
    isAdminPreviewingGf = false;
    enterApp();
    return;
  }

  // 2. Kiểm tra ngày bắt đầu yêu nhau (Mật khẩu của cô ấy)
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

  // Sai mật khẩu
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
}

function lockGate() {
  userRole = null;
  isAdminPreviewingGf = false;
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
// CẬP NHẬT GIAO DIỆN (RENDER)
// =========================================================================
function refreshAllUI() {
  renderProfile();
  renderLetter();
  renderTopicsSection();
  renderCouponsSection();
  updateMysteryDeckStats();
  renderAdminManageList();
  lucide.createIcons();
}

function renderProfile() {
  document.getElementById("display-title").textContent = appData.profile.title || "Góc Nhỏ Về Em 💖";
  document.getElementById("display-subtitle").textContent = appData.profile.subtitle || "";

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Số ngày yêu nhau (dd/mm/yyyy)
  const start = parseDateVN(appData.profile.startDate) || new Date(2025, 0, 1);
  const diffTime = Math.max(0, todayStart - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  document.getElementById("days-counter").textContent = diffDays.toLocaleString("vi-VN");
  document.getElementById("start-date-display").textContent = `Từ ${formatDateVN(start)}`;

  // Đếm ngược sự kiện đặc biệt (dd/mm/yyyy)
  const eventLabelEl = document.getElementById("special-event-label");
  const eventDaysEl = document.getElementById("special-event-days");
  const eventDateDisplayEl = document.getElementById("special-event-date-display");

  const eventName = appData.profile.eventName || "Ngày đặc biệt ✨";
  const targetDate = parseDateVN(appData.profile.eventDate);

  eventLabelEl.textContent = eventName;
  if (targetDate) {
    eventDateDisplayEl.textContent = `Ngày ${formatDateVN(targetDate)}`;
    const remainDays = Math.round((targetDate - todayStart) / (1000 * 60 * 60 * 24));
    if (remainDays > 0) {
      eventDaysEl.textContent = `Còn ${remainDays} ngày nữa`;
    } else if (remainDays === 0) {
      eventDaysEl.textContent = "Chính là hôm nay! 🎉";
    } else {
      eventDaysEl.textContent = `Đã qua ${Math.abs(remainDays)} ngày`;
    }
  } else {
    eventDateDisplayEl.textContent = "";
    eventDaysEl.textContent = "Đang chờ bật mí";
  }
}

function renderLetter() {
  document.getElementById("letter-body-text").textContent = appData.letter.body || "";
  document.getElementById("letter-sign-text").textContent = appData.letter.sign || "";
}

// =========================================================================
// CÁC MỤC CHỦ ĐỀ VỀ EM (TOPIC NOTEBOOK) - HỖ TRỢ PHÂN NHÓM CON & CÂN BẰNG LƯỚI
// =========================================================================
function normalizeTopicItem(item) {
  if (typeof item === "string") {
    return { text: item, group: "" };
  }
  return {
    text: String(item.text || ""),
    group: String(item.group || "")
  };
}

function renderSingleTopicCardHtml(topicId, entry, idx, totalInTopic, isLastOddCard, isEdit) {
  const canMoveUp = idx > 0;
  const canMoveDown = idx < totalInTopic - 1;
  const spanClass = isLastOddCard ? "sm:col-span-2" : "";

  return `
    <li class="${spanClass} flex items-start justify-between gap-2 px-3 py-2.5 rounded-2xl bg-pink-50/55 border border-pink-100/80 hover:bg-pink-50 transition">
      <div class="flex items-start gap-2 min-w-0">
        <span class="text-pink-400 font-bold text-xs mt-0.5 shrink-0">✦</span>
        <span class="text-xs sm:text-[13px] text-gray-700 font-medium leading-snug break-words">${escapeHtml(entry.text)}</span>
      </div>
      ${
        isEdit
          ? `
        <div class="flex items-center gap-0.5 shrink-0">
          <button
            onclick="moveTopicItem('${topicId}', ${idx}, -1)"
            ${!canMoveUp ? "disabled" : ""}
            class="p-1 rounded-md transition ${
              canMoveUp ? "text-pink-500 hover:bg-pink-100" : "text-gray-300 cursor-not-allowed"
            }"
            title="Đưa lên trước"
          >
            <i data-lucide="arrow-up" class="w-3 h-3"></i>
          </button>
          <button
            onclick="moveTopicItem('${topicId}', ${idx}, 1)"
            ${!canMoveDown ? "disabled" : ""}
            class="p-1 rounded-md transition ${
              canMoveDown ? "text-pink-500 hover:bg-pink-100" : "text-gray-300 cursor-not-allowed"
            }"
            title="Đưa xuống sau"
          >
            <i data-lucide="arrow-down" class="w-3 h-3"></i>
          </button>
          <button onclick="editTopicItem('${topicId}', ${idx})" class="p-1 rounded-md text-pink-500 hover:bg-pink-100" title="Sửa / Đổi nhóm dòng này">
            <i data-lucide="edit-2" class="w-3 h-3"></i>
          </button>
          <button onclick="deleteTopicItem('${topicId}', ${idx})" class="p-1 rounded-md text-rose-400 hover:bg-rose-100" title="Xóa dòng này">
            <i data-lucide="x" class="w-3 h-3"></i>
          </button>
        </div>
      `
          : ""
      }
    </li>
  `;
}

function renderTopicsSection() {
  const topics = appData.topics || [];
  const tabsBar = document.getElementById("topic-tabs-bar");
  const panel = document.getElementById("active-topic-panel");
  const isEdit = isEditingAllowed();

  if (topics.length === 0) {
    tabsBar.innerHTML = "";
    panel.innerHTML = `
      <div class="text-center py-8 text-gray-400 text-xs">
        Chưa có mục ghi chép nào. ${isEdit ? "Bấm '+ Thêm Mục Mới' ở góc trên để tạo nhé!" : ""}
      </div>
    `;
    return;
  }

  let activeIndex = topics.findIndex((t) => t.id === activeTopicId);
  if (activeIndex === -1) {
    activeIndex = 0;
    activeTopicId = topics[0].id;
  }

  // Render các Tab (kèm số lượng nhỏ gọn)
  tabsBar.innerHTML = topics
    .map((t) => {
      const isActive = t.id === activeTopicId;
      const count = (t.items || []).length;
      return `
        <button
          onclick="selectTopicTab('${t.id}')"
          class="shrink-0 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            isActive
              ? "bg-pink-500 text-white shadow-sm"
              : "bg-pink-50/80 text-pink-700 hover:bg-pink-100"
          }"
        >
          <span>${t.icon || "💖"}</span>
          <span>${escapeHtml(t.name)}</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full ${
            isActive ? "bg-white/25 text-white" : "bg-pink-200/60 text-pink-600"
          }">${count}</span>
        </button>
      `;
    })
    .join("");

  const activeTopic = topics[activeIndex];
  const rawItems = activeTopic.items || [];
  const normalizedItems = rawItems.map((it, originalIdx) => ({
    ...normalizeTopicItem(it),
    originalIdx
  }));

  const groupSet = new Set(Array.isArray(activeTopic.groups) ? activeTopic.groups : []);
  normalizedItems.forEach((it) => {
    if (it.group) groupSet.add(it.group);
  });
  const groupList = Array.from(groupSet);

  const canMoveTabLeft = activeIndex > 0;
  const canMoveTabRight = activeIndex < topics.length - 1;

  const queryNorm = topicSearchQuery.trim().toLowerCase();
  const filteredItems = normalizedItems.filter(
    (entry) =>
      !queryNorm ||
      entry.text.toLowerCase().includes(queryNorm) ||
      entry.group.toLowerCase().includes(queryNorm)
  );

  const hasSubGroups = groupList.length > 0 && filteredItems.some((it) => it.group);

  const adminHeaderControls = isEdit
    ? `
      <div class="flex flex-wrap items-center gap-1">
        <button
          onclick="addTopicSubGroup('${activeTopic.id}')"
          class="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-[11px] font-bold flex items-center gap-1 transition"
          title="Tạo nhóm nhỏ phân loại bên trong mục này"
        >
          <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
          <span>+ Chia nhóm</span>
        </button>
        <button
          onclick="moveTopic(${activeIndex}, -1)"
          ${!canMoveTabLeft ? "disabled" : ""}
          class="p-1.5 rounded-lg border transition ${
            canMoveTabLeft
              ? "bg-white text-pink-600 hover:bg-pink-100 border-pink-200"
              : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
          }"
          title="Di chuyển mục sang trái"
        >
          <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
        </button>
        <button
          onclick="moveTopic(${activeIndex}, 1)"
          ${!canMoveTabRight ? "disabled" : ""}
          class="p-1.5 rounded-lg border transition ${
            canMoveTabRight
              ? "bg-white text-pink-600 hover:bg-pink-100 border-pink-200"
              : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
          }"
          title="Di chuyển mục sang phải"
        >
          <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="openTopicModal('${activeTopic.id}')" class="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-200" title="Đổi tên / icon mục">
          <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="deleteTopic('${activeTopic.id}')" class="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-200" title="Xóa mục này">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `
    : "";

  const subGroupsBarHtml =
    isEdit && groupList.length > 0
      ? `
      <div class="flex flex-wrap items-center gap-1.5 mb-3 p-2 rounded-xl bg-amber-50/60 border border-amber-100">
        <span class="text-[11px] font-bold text-amber-700 mr-1">Các nhóm nhỏ:</span>
        ${groupList
          .map(
            (g) => `
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-amber-800 border border-amber-200 text-[11px] font-semibold">
            <span>${escapeHtml(g)}</span>
            <button onclick="removeTopicSubGroup('${activeTopic.id}', '${escapeHtml(g).replace(/'/g, "\\'")}')" class="text-gray-400 hover:text-rose-500 ml-0.5" title="Gỡ nhóm này">✕</button>
          </span>
        `
          )
          .join("")}
      </div>
    `
      : "";

  const searchBarHtml =
    normalizedItems.length >= 6
      ? `
      <div class="relative mb-3">
        <i data-lucide="search" class="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
        <input
          type="text"
          id="topic-quick-search"
          value="${escapeHtml(topicSearchQuery)}"
          oninput="handleTopicSearch(this.value)"
          placeholder="Tìm nhanh trong ${normalizedItems.length} điều của mục này..."
          class="w-full pl-8 pr-8 py-1.5 rounded-xl bg-pink-50/60 border border-pink-100 text-xs text-gray-700 focus:outline-none focus:border-pink-400 focus:bg-white transition"
        />
        ${
          topicSearchQuery
            ? `<button onclick="handleTopicSearch('')" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 text-xs font-bold">✕</button>`
            : ""
        }
      </div>
    `
      : "";

  let contentBodyHtml = "";
  let expandToggleHtml = "";

  if (filteredItems.length === 0) {
    contentBodyHtml = `<p class="text-xs text-gray-400 italic py-4 text-center">${
      queryNorm ? "Không tìm thấy dòng nào khớp từ khóa..." : "Mục này chưa có ghi chú nào..."
    }</p>`;
  } else if (hasSubGroups) {
    const orderedBuckets = [];
    const seenGroups = new Set();

    groupList.forEach((g) => {
      const bucketItems = filteredItems.filter((it) => it.group === g);
      if (bucketItems.length > 0) {
        orderedBuckets.push({ title: g, items: bucketItems });
        seenGroups.add(g);
      }
    });

    const ungroupedItems = filteredItems.filter((it) => !it.group || !seenGroups.has(it.group));
    if (ungroupedItems.length > 0) {
      orderedBuckets.push({ title: "Khác", items: ungroupedItems });
    }

    contentBodyHtml = `
      <div class="space-y-4">
        ${orderedBuckets
          .map(
            (bucket) => `
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-bold text-pink-600 bg-pink-100/70 px-2.5 py-0.5 rounded-full">
                ${escapeHtml(bucket.title)} (${bucket.items.length})
              </span>
              <div class="h-px flex-1 bg-pink-100"></div>
            </div>
            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${bucket.items
                .map((entry, idxInBucket) => {
                  const isLastOdd =
                    bucket.items.length % 2 === 1 && idxInBucket === bucket.items.length - 1;
                  return renderSingleTopicCardHtml(
                    activeTopic.id,
                    entry,
                    entry.originalIdx,
                    normalizedItems.length,
                    isLastOdd,
                    isEdit
                  );
                })
                .join("")}
            </ul>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  } else {
    const isExpanded = expandedTopicIds.has(activeTopic.id) || Boolean(queryNorm);
    const hasMoreToShow = !isExpanded && filteredItems.length > TOPIC_COLLAPSE_LIMIT;
    const visibleItems = isExpanded
      ? filteredItems
      : filteredItems.slice(0, TOPIC_COLLAPSE_LIMIT);
    const hiddenCount = filteredItems.length - visibleItems.length;

    contentBodyHtml = `
      <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${visibleItems
          .map((entry, idxInList) => {
            const isLastOdd =
              visibleItems.length % 2 === 1 && idxInList === visibleItems.length - 1;
            return renderSingleTopicCardHtml(
              activeTopic.id,
              entry,
              entry.originalIdx,
              normalizedItems.length,
              isLastOdd,
              isEdit
            );
          })
          .join("")}
      </ul>
    `;

    if (!queryNorm && filteredItems.length > TOPIC_COLLAPSE_LIMIT) {
      expandToggleHtml = `
        <div class="mt-3 text-center">
          <button
            onclick="toggleTopicExpand('${activeTopic.id}')"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200/80 text-xs font-bold transition"
          >
            ${
              hasMoreToShow
                ? `<i data-lucide="chevron-down" class="w-3.5 h-3.5"></i><span>Xem thêm (${hiddenCount} điều nữa)</span>`
                : `<i data-lucide="chevron-up" class="w-3.5 h-3.5"></i><span>Thu gọn bớt</span>`
            }
          </button>
        </div>
      `;
    }
  }

  const groupSelectHtml =
    groupList.length > 0
      ? `
      <select
        id="new-topic-item-group"
        onchange="selectedNewItemGroup = this.value"
        class="px-2.5 py-2 rounded-xl border border-pink-200 text-xs font-semibold text-pink-700 bg-pink-50/60 focus:outline-none focus:border-pink-500 shrink-0"
      >
        <option value="">Nhóm: Chung</option>
        ${groupList
          .map(
            (g) =>
              `<option value="${escapeHtml(g)}" ${
                selectedNewItemGroup === g ? "selected" : ""
              }>${escapeHtml(g)}</option>`
          )
          .join("")}
      </select>
    `
      : "";

  const addItemFormHtml = isEdit
    ? `
      <div class="mt-4 pt-3 border-t border-pink-100 flex flex-wrap sm:flex-nowrap items-center gap-2">
        ${groupSelectHtml}
        <input
          type="text"
          id="new-topic-item-input"
          placeholder="Thêm một điều mới vào '${escapeHtml(activeTopic.name)}'..."
          class="flex-1 min-w-[160px] px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm focus:outline-none focus:border-pink-500"
          onkeydown="if(event.key==='Enter') addTopicItem('${activeTopic.id}')"
        />
        <button
          onclick="addTopicItem('${activeTopic.id}')"
          class="px-4 py-2 rounded-xl bg-pink-500 text-white text-xs font-bold hover:bg-pink-600 transition shrink-0"
        >
          + Thêm
        </button>
      </div>
    `
    : "";

  panel.innerHTML = `
    <div class="animate-pop-in">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${activeTopic.icon || "💖"}</span>
          <h4 class="font-bold text-base sm:text-lg text-gray-800">${escapeHtml(activeTopic.name)}</h4>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-600">${normalizedItems.length}</span>
        </div>
        ${adminHeaderControls}
      </div>

      ${subGroupsBarHtml}
      ${searchBarHtml}
      ${contentBodyHtml}
      ${expandToggleHtml}
      ${addItemFormHtml}
    </div>
  `;
  lucide.createIcons();

  if (topicSearchQuery) {
    const searchEl = document.getElementById("topic-quick-search");
    if (searchEl) {
      searchEl.focus();
      searchEl.setSelectionRange(searchEl.value.length, searchEl.value.length);
    }
  }
}

function selectTopicTab(topicId) {
  activeTopicId = topicId;
  topicSearchQuery = "";
  selectedNewItemGroup = "";
  renderTopicsSection();
}

function toggleTopicExpand(topicId) {
  if (expandedTopicIds.has(topicId)) {
    expandedTopicIds.delete(topicId);
  } else {
    expandedTopicIds.add(topicId);
  }
  renderTopicsSection();
}

function handleTopicSearch(val) {
  topicSearchQuery = val;
  renderTopicsSection();
}

async function addTopicSubGroup(topicId) {
  const topic = appData.topics.find((t) => t.id === topicId);
  if (!topic) return;

  const dialogRes = await openCustomDialog({
    title: `Tạo nhóm nhỏ trong "${topic.name}"`,
    desc: "Bạn có thể chuyển sang tab/cửa sổ khác để copy và dán tên nhóm thoải mái mà hộp thoại không bị đóng.",
    placeholder: "VD: 🧋 Đồ uống, 🍿 Đồ ăn vặt, 🍚 Món chính..."
  });

  if (!dialogRes || !dialogRes.text || !dialogRes.text.trim()) return;

  const clean = dialogRes.text.trim();
  topic.groups = Array.isArray(topic.groups) ? topic.groups : [];
  if (!topic.groups.includes(clean)) {
    topic.groups.push(clean);
  }
  selectedNewItemGroup = clean;
  await saveAppData();
}

async function removeTopicSubGroup(topicId, groupName) {
  const topic = appData.topics.find((t) => t.id === topicId);
  if (!topic) return;

  if (!confirm(`Gỡ nhóm "${groupName}"? (Các món bên trong vẫn giữ nguyên, chỉ chuyển về nhóm Chung)`)) {
    return;
  }

  topic.groups = (topic.groups || []).filter((g) => g !== groupName);
  topic.items = (topic.items || []).map((it) => {
    const norm = normalizeTopicItem(it);
    if (norm.group === groupName) {
      return norm.text;
    }
    return it;
  });

  if (selectedNewItemGroup === groupName) {
    selectedNewItemGroup = "";
  }
  await saveAppData();
}

async function moveTopic(index, direction) {
  const topics = appData.topics || [];
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= topics.length) return;

  const temp = topics[index];
  topics[index] = topics[targetIndex];
  topics[targetIndex] = temp;

  await saveAppData();
}

async function moveTopicItem(topicId, index, direction) {
  const topic = appData.topics.find((t) => t.id === topicId);
  if (!topic || !Array.isArray(topic.items)) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= topic.items.length) return;

  const temp = topic.items[index];
  topic.items[index] = topic.items[targetIndex];
  topic.items[targetIndex] = temp;

  await saveAppData();
}

async function addTopicItem(topicId) {
  const input = document.getElementById("new-topic-item-input");
  const groupSelect = document.getElementById("new-topic-item-group");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  const group = groupSelect ? groupSelect.value : "";

  const topic = appData.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.items = topic.items || [];
  if (group) {
    topic.items.push({ text, group });
  } else {
    topic.items.push(text);
  }

  expandedTopicIds.add(topicId);
  input.value = "";
  await saveAppData();
}

async function editTopicItem(topicId, index) {
  const topic = appData.topics.find((t) => t.id === topicId);
  if (!topic || !topic.items[index]) return;

  const current = normalizeTopicItem(topic.items[index]);
  const groupList = Array.isArray(topic.groups) ? topic.groups : [];

  const dialogRes = await openCustomDialog({
    title: "Chỉnh sửa ghi chú",
    desc: groupList.length > 0 ? "Sửa nội dung hoặc chọn lại nhóm phân loại bên dưới:" : "",
    defaultValue: current.text,
    groups: groupList,
    selectedGroup: current.group
  });

  if (!dialogRes) return;
  const trimmedText = dialogRes.text.trim();
  if (!trimmedText) return;

  const chosenGroup = dialogRes.group || "";
  topic.items[index] = chosenGroup ? { text: trimmedText, group: chosenGroup } : trimmedText;
  await saveAppData();
}

async function deleteTopicItem(topicId, index) {
  const topic = appData.topics.find((t) => t.id === topicId);
  if (!topic) return;
  topic.items.splice(index, 1);
  await saveAppData();
}

function renderTopicIconPicker() {
  const picker = document.getElementById("topic-icon-picker");
  picker.innerHTML = TOPIC_ICONS.map(
    (ic) => `
    <button type="button" onclick="selectTopicIcon('${ic}')" data-ticon="${ic}" class="ticon-btn w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white transition ${
      ic === selectedTopicIcon ? "bg-white ring-2 ring-pink-400 shadow-sm" : ""
    }">
      ${ic}
    </button>
  `
  ).join("");
}

function selectTopicIcon(ic) {
  selectedTopicIcon = ic;
  document.querySelectorAll(".ticon-btn").forEach((btn) => {
    btn.className =
      btn.dataset.ticon === ic
        ? "ticon-btn w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-white ring-2 ring-pink-400 shadow-sm"
        : "ticon-btn w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white transition";
  });
}

function openTopicModal(topicId = null) {
  document.getElementById("edit-topic-id").value = topicId || "";
  if (topicId) {
    const topic = appData.topics.find((t) => t.id === topicId);
    if (!topic) return;
    document.getElementById("topic-modal-title").innerHTML = `<i data-lucide="pencil" class="w-5 h-5"></i> Chỉnh Sửa Mục`;
    document.getElementById("input-topic-name").value = topic.name || "";
    selectTopicIcon(topic.icon || "🏷️");
  } else {
    document.getElementById("topic-modal-title").innerHTML = `<i data-lucide="folder-heart" class="w-5 h-5"></i> Thêm Mục Ghi Chép Mới`;
    document.getElementById("input-topic-name").value = "";
    selectTopicIcon("🏷️");
  }
  document.getElementById("modal-topic").classList.remove("hidden");
  lucide.createIcons();
}

function closeTopicModal() {
  document.getElementById("modal-topic").classList.add("hidden");
}

async function saveTopic() {
  const name = document.getElementById("input-topic-name").value.trim();
  const editId = document.getElementById("edit-topic-id").value;
  if (!name) {
    alert("Anh nhớ nhập tên mục nhé!");
    return;
  }

  if (editId) {
    const topic = appData.topics.find((t) => t.id === editId);
    if (topic) {
      topic.name = name;
      topic.icon = selectedTopicIcon;
    }
  } else {
    const newId = "topic_" + Date.now();
    appData.topics.push({
      id: newId,
      name,
      icon: selectedTopicIcon,
      groups: [],
      items: []
    });
    activeTopicId = newId;
  }

  closeTopicModal();
  await saveAppData();
}

async function deleteTopic(topicId) {
  if (!confirm("Xóa mục này sẽ xóa toàn bộ ghi chú bên trong nó. Anh chắc chắn chứ?")) return;
  appData.topics = appData.topics.filter((t) => t.id !== topicId);
  await saveAppData();
}

// =========================================================================
// PHIẾU ĐỔI QUÀ TÌNH YÊU (LOVE COUPONS)
// =========================================================================
function renderCouponsSection() {
  const grid = document.getElementById("coupons-grid");
  const coupons = appData.coupons || [];
  const isEdit = isEditingAllowed();

  if (coupons.length === 0) {
    grid.innerHTML = `<p class="col-span-full text-center text-xs text-gray-400 py-4">Chưa có phiếu đổi quà nào.</p>`;
    return;
  }

  grid.innerHTML = coupons
    .map((cp) => {
      const isUsed = Boolean(cp.used);
      return `
        <div class="relative rounded-2xl p-4 border-2 border-dashed transition-all ${
          isUsed
            ? "bg-gray-50 border-gray-200 opacity-80"
            : "bg-gradient-to-br from-pink-50/90 to-purple-50/80 border-pink-300 shadow-sm hover:shadow-md"
        }">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl select-none">${cp.icon || "🎟️"}</span>
              <div>
                <h4 class="font-bold text-sm text-gray-800 ${isUsed ? "line-through text-gray-500" : ""}">
                  ${escapeHtml(cp.title)}
                </h4>
                <p class="text-[11px] text-gray-500 mt-0.5">${escapeHtml(cp.desc || "")}</p>
              </div>
            </div>

            ${
              isEdit
                ? `<div class="flex items-center gap-1 shrink-0">
                     <button onclick="openCouponModal('${cp.id}')" class="p-1.5 rounded-lg text-purple-600 hover:bg-purple-100 transition" title="Chỉnh sửa phiếu">
                       <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                     </button>
                     <button onclick="deleteCoupon('${cp.id}')" class="p-1.5 rounded-lg text-rose-400 hover:bg-rose-100 transition" title="Xóa phiếu">
                       <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                     </button>
                   </div>`
                : ""
            }
          </div>

          <div class="mt-3 pt-2.5 border-t border-pink-200/60 flex items-center justify-between gap-2">
            ${
              isUsed
                ? `<span class="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                     <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Đã dùng (${escapeHtml(formatDateVN(cp.usedAt) || "Vừa xong")})
                   </span>
                   ${
                     isEdit
                       ? `<button onclick="toggleCouponStatus('${cp.id}', false)" class="px-2.5 py-1 rounded-lg bg-white text-purple-600 border border-purple-200 text-[11px] font-bold hover:bg-purple-50">
                            Tặng lại
                          </button>`
                       : ""
                   }`
                : `<span class="text-[11px] font-semibold text-pink-500">Chưa sử dụng</span>
                   <button onclick="redeemCoupon('${cp.id}')" class="px-3 py-1 rounded-full bg-pink-500 text-white text-[11px] font-bold shadow-sm hover:bg-pink-600 transition">
                     Sử Dụng Ngay ✨
                   </button>`
            }
          </div>
        </div>
      `;
    })
    .join("");
  lucide.createIcons();
}

async function redeemCoupon(couponId) {
  const cp = appData.coupons.find((c) => c.id === couponId);
  if (!cp || cp.used) return;

  if (!confirm(`Em muốn kích hoạt phiếu "${cp.title}" ngay bây giờ chứ?`)) return;

  cp.used = true;
  cp.usedAt = getTodayVN();
  triggerHeartConfetti();
  await saveAppData();
}

async function toggleCouponStatus(couponId, usedState) {
  const cp = appData.coupons.find((c) => c.id === couponId);
  if (!cp) return;
  cp.used = usedState;
  cp.usedAt = usedState ? getTodayVN() : "";
  await saveAppData();
}

function renderCouponIconPicker() {
  const picker = document.getElementById("coupon-icon-picker");
  picker.innerHTML = COUPON_ICONS.map(
    (ic) => `
    <button type="button" onclick="selectCouponIcon('${ic}')" data-cicon="${ic}" class="cicon-btn w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white transition ${
      ic === selectedCouponIcon ? "bg-white ring-2 ring-purple-400 shadow-sm" : ""
    }">
      ${ic}
    </button>
  `
  ).join("");
}

function selectCouponIcon(ic) {
  selectedCouponIcon = ic;
  document.querySelectorAll(".cicon-btn").forEach((btn) => {
    btn.className =
      btn.dataset.cicon === ic
        ? "cicon-btn w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-white ring-2 ring-purple-400 shadow-sm"
        : "cicon-btn w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white transition";
  });
}

function openCouponModal(couponId = null) {
  document.getElementById("edit-coupon-id").value = couponId || "";

  if (couponId) {
    const cp = (appData.coupons || []).find((c) => c.id === couponId);
    if (!cp) return;
    document.getElementById("coupon-modal-title").innerHTML = `<i data-lucide="pencil" class="w-5 h-5"></i> Chỉnh Sửa Phiếu Đổi Quà`;
    document.getElementById("input-coupon-title").value = cp.title || "";
    document.getElementById("input-coupon-desc").value = cp.desc || "";
    selectCouponIcon(cp.icon || "🧋");
  } else {
    document.getElementById("coupon-modal-title").innerHTML = `<i data-lucide="ticket" class="w-5 h-5"></i> Tạo Phiếu Đổi Quà Mới`;
    document.getElementById("input-coupon-title").value = "";
    document.getElementById("input-coupon-desc").value = "";
    selectCouponIcon("🧋");
  }

  document.getElementById("modal-coupon").classList.remove("hidden");
  lucide.createIcons();
}

function closeCouponModal() {
  document.getElementById("modal-coupon").classList.add("hidden");
}

async function saveCoupon() {
  const title = document.getElementById("input-coupon-title").value.trim();
  const desc = document.getElementById("input-coupon-desc").value.trim();
  const editId = document.getElementById("edit-coupon-id").value;

  if (!title) {
    alert("Anh nhớ nhập tên phiếu quà tặng nhé!");
    return;
  }

  appData.coupons = appData.coupons || [];

  if (editId) {
    const cp = appData.coupons.find((c) => c.id === editId);
    if (cp) {
      cp.title = title;
      cp.desc = desc;
      cp.icon = selectedCouponIcon;
    }
  } else {
    appData.coupons.push({
      id: "cp_" + Date.now(),
      icon: selectedCouponIcon,
      title,
      desc,
      used: false,
      usedAt: ""
    });
  }

  closeCouponModal();
  await saveAppData();
}

async function deleteCoupon(couponId) {
  if (!confirm("Anh muốn xóa phiếu quà tặng này?")) return;
  appData.coupons = appData.coupons.filter((c) => c.id !== couponId);
  await saveAppData();
}

// =========================================================================
// SÂN KHẤU RÚT THẺ BÍ MẬT & PHẢN HỒI CỦA EM (MYSTERY DECK)
// =========================================================================
function updateMysteryDeckStats() {
  const total = appData.memories.length;
  document.getElementById("mystery-total-count").textContent = total;
  document.getElementById("admin-count").textContent = total;

  const validIds = new Set(appData.memories.map((m) => m.id));
  unseenIds = unseenIds.filter((id) => validIds.has(id));

  if (unseenIds.length === 0 && total > 0) {
    unseenIds = appData.memories.map((m) => m.id);
  }

  if (currentRevealedId && validIds.has(currentRevealedId)) {
    const mem = appData.memories.find((m) => m.id === currentRevealedId);
    renderRevealedCard(mem, false);
  } else if (currentRevealedId && !validIds.has(currentRevealedId)) {
    document.getElementById("revealed-stage").classList.add("hidden");
    currentRevealedId = null;
  }
}

function drawRandomMemory() {
  const total = appData.memories.length;
  if (total === 0) {
    alert("Chưa có thẻ bí mật nào trong hộp!");
    return;
  }

  if (unseenIds.length === 0) {
    unseenIds = appData.memories.map((m) => m.id);
  }

  let candidates = unseenIds;
  if (candidates.length > 1 && currentRevealedId) {
    candidates = candidates.filter((id) => id !== currentRevealedId);
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  const chosenId = candidates[randomIndex];

  unseenIds = unseenIds.filter((id) => id !== chosenId);
  currentRevealedId = chosenId;

  const memory = appData.memories.find((m) => m.id === chosenId);
  renderRevealedCard(memory, true);
  triggerHeartConfetti();

  const seenCount = total - unseenIds.length;
  const progressEl = document.getElementById("seen-progress-text");
  if (unseenIds.length === 0) {
    progressEl.textContent = `✨ Em đã mở hết ${total}/${total} bí mật rồi! Bấm tiếp để xáo lại từ đầu nhé.`;
    document.getElementById("draw-btn-label").textContent = "Xáo Lại Hộp Kỷ Niệm";
  } else {
    progressEl.textContent = `Đã mở ${seenCount}/${total} kỷ niệm bí mật`;
    document.getElementById("draw-btn-label").textContent = "Mở Một Điều Bất Ngờ Khác";
  }
}

function renderRevealedCard(mem, animate = true) {
  if (!mem) return;
  const stage = document.getElementById("revealed-stage");
  const slot = document.getElementById("revealed-card-slot");
  stage.classList.remove("hidden");

  const formattedDate = formatDateVN(mem.date);

  const imageHtml = mem.image
    ? `<div class="mb-4 rounded-xl overflow-hidden bg-pink-50 border border-pink-100">
         <img src="${mem.image}" alt="${escapeHtml(mem.title)}" class="w-full max-h-80 object-cover mx-auto" />
       </div>`
    : "";

  const reactions = ["🥰", "😂", "🥹", "💖"];
  const reactionButtonsHtml = reactions
    .map((emo) => {
      const isSelected = mem.gfReaction === emo;
      return `
        <button
          onclick="setMemoryReaction('${mem.id}', '${emo}')"
          class="w-8 h-8 rounded-full flex items-center justify-center text-base transition ${
            isSelected
              ? "bg-pink-500 text-white scale-110 shadow-sm ring-2 ring-pink-200"
              : "bg-pink-50 hover:bg-pink-100"
          }"
          title="Thả cảm xúc"
        >
          ${emo}
        </button>
      `;
    })
    .join("");

  const replyDisplayHtml = mem.gfReply
    ? `<div class="mt-2.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-100 text-xs text-amber-900 flex items-start justify-between gap-2">
         <div><span class="font-bold text-pink-600">Lời nhắn của em:</span> ${escapeHtml(mem.gfReply)}</div>
       </div>`
    : "";

  slot.innerHTML = `
    <div class="polaroid-card ${animate ? "animate-pop-in" : ""}">
      <div class="washi-tape"></div>
      <div class="flex items-center justify-between gap-2 mb-3 pt-1">
        <span class="px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-bold border border-pink-100">
          ${escapeHtml(mem.tag || "Kỷ niệm")}
        </span>
        <span class="text-xs font-semibold text-pink-400">${formattedDate}</span>
      </div>

      ${imageHtml}

      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg sm:text-xl font-bold text-gray-800 leading-snug">
          ${escapeHtml(mem.title)}
        </h3>
        <span class="text-3xl select-none shrink-0">${mem.sticker || "💖"}</span>
      </div>

      <p class="font-note text-2xl sm:text-[26px] text-gray-700 mt-3 leading-relaxed whitespace-pre-line">
        "${escapeHtml(mem.note)}"
      </p>

      <!-- Girlfriend Interactive Reaction & Note Box -->
      <div class="mt-4 pt-3 border-t border-pink-100">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] font-bold text-pink-400 mr-1">Cảm xúc của em:</span>
            ${reactionButtonsHtml}
          </div>
          <button
            onclick="replyToMemory('${mem.id}')"
            class="text-xs font-bold text-pink-500 hover:text-pink-600 flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-50 hover:bg-pink-100 transition"
          >
            <i data-lucide="message-circle-heart" class="w-3.5 h-3.5"></i>
            <span>${mem.gfReply ? "Sửa lời nhắn" : "Nhắn lại cho anh"}</span>
          </button>
        </div>
        ${replyDisplayHtml}
      </div>
    </div>
  `;
  lucide.createIcons();
}

async function setMemoryReaction(memId, emoji) {
  const mem = appData.memories.find((m) => m.id === memId);
  if (!mem) return;
  mem.gfReaction = mem.gfReaction === emoji ? "" : emoji;
  if (mem.gfReaction) triggerHeartConfetti();
  await saveAppData();
}

async function replyToMemory(memId) {
  const mem = appData.memories.find((m) => m.id === memId);
  if (!mem) return;

  const dialogRes = await openCustomDialog({
    title: "Nhắn lại cho anh 💌",
    desc: "Em muốn nhắn lại điều gì về kỷ niệm này cho anh biết không?",
    defaultValue: mem.gfReply || "",
    placeholder: "Viết lời nhắn của em..."
  });

  if (!dialogRes) return;
  mem.gfReply = dialogRes.text.trim();
  await saveAppData();
}

// =========================================================================
// QUẢN LÝ THẺ BÍ MẬT (THÊM / SỬA / XÓA)
// =========================================================================
function toggleManageDrawer() {
  const drawer = document.getElementById("admin-manage-drawer");
  drawer.classList.toggle("hidden");
  renderAdminManageList();
}

function renderAdminManageList() {
  const container = document.getElementById("admin-memories-list");
  if (!container) return;
  if (appData.memories.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 italic">Chưa có thẻ bí mật nào.</p>`;
    return;
  }

  container.innerHTML = appData.memories
    .map(
      (m) => `
      <div class="flex items-center justify-between gap-3 p-3 rounded-2xl bg-pink-50/70 border border-pink-100">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-xl shrink-0">${m.sticker || "💖"}</span>
          <div class="truncate">
            <div class="text-xs font-bold text-gray-800 truncate">
              ${escapeHtml(m.title)} ${m.gfReaction ? `<span class="ml-1">${m.gfReaction}</span>` : ""}
            </div>
            <div class="text-[11px] text-gray-500 truncate">${escapeHtml(m.note)}</div>
            ${m.gfReply ? `<div class="text-[11px] font-semibold text-amber-700 truncate mt-0.5">💌 Em nhắn: "${escapeHtml(m.gfReply)}"</div>` : ""}
          </div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="openMemoryModal('${m.id}')" class="p-1.5 rounded-lg bg-white text-pink-600 hover:bg-pink-100 border border-pink-200" title="Sửa">
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="deleteMemory('${m.id}')" class="p-1.5 rounded-lg bg-white text-rose-500 hover:bg-rose-50 border border-rose-200" title="Xóa">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `
    )
    .join("");
  lucide.createIcons();
}

function renderStickerPicker() {
  const picker = document.getElementById("sticker-picker");
  picker.innerHTML = STICKERS.map(
    (s) => `
    <button type="button" onclick="selectSticker('${s}')" data-sticker="${s}" class="sticker-btn w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white transition ${
      s === selectedSticker ? "bg-white ring-2 ring-pink-400 shadow-sm" : ""
    }">
      ${s}
    </button>
  `
  ).join("");
}

function selectSticker(s) {
  selectedSticker = s;
  document.querySelectorAll(".sticker-btn").forEach((btn) => {
    btn.className =
      btn.dataset.sticker === s
        ? "sticker-btn w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-white ring-2 ring-pink-400 shadow-sm"
        : "sticker-btn w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white transition";
  });
}

function openMemoryModal(id = null) {
  document.getElementById("edit-memory-id").value = id || "";
  document.getElementById("mem-image-file").value = "";

  if (id) {
    const mem = appData.memories.find((m) => m.id === id);
    if (!mem) return;
    document.getElementById("memory-modal-title").innerHTML = `<i data-lucide="pencil" class="w-5 h-5"></i> Chỉnh Sửa Thẻ Bí Mật`;
    document.getElementById("mem-title").value = mem.title || "";
    document.getElementById("mem-date").value = formatDateVN(mem.date) || "";
    document.getElementById("mem-tag").value = mem.tag || "Kỷ niệm của tụi mình";
    document.getElementById("mem-note").value = mem.note || "";
    selectSticker(mem.sticker || "💖");
    uploadedImageBase64 = mem.image || "";
  } else {
    document.getElementById("memory-modal-title").innerHTML = `<i data-lucide="camera" class="w-5 h-5"></i> Thêm Thẻ Bí Mật`;
    document.getElementById("mem-title").value = "";
    document.getElementById("mem-date").value = getTodayVN();
    document.getElementById("mem-tag").value = "Thói quen đáng yêu";
    document.getElementById("mem-note").value = "";
    selectSticker("💖");
    uploadedImageBase64 = "";
  }

  if (uploadedImageBase64) {
    document.getElementById("mem-image-preview").src = uploadedImageBase64;
    document.getElementById("mem-image-preview-box").classList.remove("hidden");
  } else {
    document.getElementById("mem-image-preview-box").classList.add("hidden");
  }

  document.getElementById("modal-memory").classList.remove("hidden");
  lucide.createIcons();
}

function closeMemoryModal() {
  document.getElementById("modal-memory").classList.add("hidden");
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 720;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      uploadedImageBase64 = canvas.toDataURL("image/jpeg", 0.72);
      document.getElementById("mem-image-preview").src = uploadedImageBase64;
      document.getElementById("mem-image-preview-box").classList.remove("hidden");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearUploadedImage() {
  uploadedImageBase64 = "";
  document.getElementById("mem-image-file").value = "";
  document.getElementById("mem-image-preview-box").classList.add("hidden");
}

async function saveMemory() {
  const title = document.getElementById("mem-title").value.trim();
  const note = document.getElementById("mem-note").value.trim();
  const rawDate = document.getElementById("mem-date").value.trim();
  const tag = document.getElementById("mem-tag").value;
  const editId = document.getElementById("edit-memory-id").value;

  if (!title || !note) {
    alert("Anh nhớ nhập đủ Tiêu đề và Lời nhắn nhé!");
    return;
  }

  const formattedDate = rawDate ? formatDateVN(rawDate) : getTodayVN();

  if (editId) {
    const idx = appData.memories.findIndex((m) => m.id === editId);
    if (idx !== -1) {
      appData.memories[idx] = {
        ...appData.memories[idx],
        title,
        date: formattedDate,
        tag,
        sticker: selectedSticker,
        image: uploadedImageBase64,
        note
      };
    }
  } else {
    const newMem = {
      id: "mem_" + Date.now(),
      title,
      date: formattedDate,
      tag,
      sticker: selectedSticker,
      image: uploadedImageBase64,
      note,
      gfReaction: "",
      gfReply: ""
    };
    appData.memories.unshift(newMem);
    unseenIds.push(newMem.id);
  }

  closeMemoryModal();
  await saveAppData();
}

async function deleteMemory(id) {
  if (!confirm("Anh có chắc muốn xóa thẻ này không?")) return;
  appData.memories = appData.memories.filter((m) => m.id !== id);
  await saveAppData();
}

// =========================================================================
// CÀI ĐẶT HỒ SƠ & BỨC THƯ BÍ MẬT
// =========================================================================
function openProfileModal() {
  document.getElementById("input-title").value = appData.profile.title || "";
  document.getElementById("input-subtitle").value = appData.profile.subtitle || "";
  document.getElementById("input-start-date").value = formatDateVN(appData.profile.startDate) || "01/01/2025";
  document.getElementById("input-event-name").value = appData.profile.eventName || "";
  document.getElementById("input-event-date").value = formatDateVN(appData.profile.eventDate) || "";
  document.getElementById("input-new-password").value = appData.profile.adminPassword || "";
  document.getElementById("modal-profile").classList.remove("hidden");
}

function closeProfileModal() {
  document.getElementById("modal-profile").classList.add("hidden");
}

async function saveProfile() {
  const rawStart = document.getElementById("input-start-date").value.trim();
  const rawEvent = document.getElementById("input-event-date").value.trim();

  if (rawStart && !parseDateVN(rawStart)) {
    alert("Ngày bắt đầu yêu nhau chưa hợp lệ (VD: 15082026 hoặc 15/08/2026)");
    return;
  }

  if (rawEvent && !parseDateVN(rawEvent)) {
    alert("Ngày sự kiện đặc biệt chưa hợp lệ (VD: 25/12/2026)");
    return;
  }

  appData.profile.title = document.getElementById("input-title").value.trim() || "Góc Nhỏ Về Em 💖";
  appData.profile.subtitle = document.getElementById("input-subtitle").value.trim();
  appData.profile.startDate = rawStart ? formatDateVN(rawStart) : "01/01/2025";
  appData.profile.eventName = document.getElementById("input-event-name").value.trim() || "Ngày đặc biệt ✨";
  appData.profile.eventDate = rawEvent ? formatDateVN(rawEvent) : "";

  const newPass = document.getElementById("input-new-password").value.trim();
  if (newPass) {
    appData.profile.adminPassword = newPass;
  }

  closeProfileModal();
  await saveAppData();
}

function toggleSecretLetter() {
  const box = document.getElementById("secret-letter-content");
  const btn = document.getElementById("btn-toggle-letter");
  if (box.classList.contains("hidden")) {
    box.classList.remove("hidden");
    btn.textContent = "Gấp Thư Lại";
    triggerHeartConfetti();
  } else {
    box.classList.add("hidden");
    btn.textContent = "Mở Phong Bì";
  }
}

function openLetterModal() {
  document.getElementById("input-letter-body").value = appData.letter.body || "";
  document.getElementById("input-letter-sign").value = appData.letter.sign || "";
  document.getElementById("modal-letter").classList.remove("hidden");
}

function closeLetterModal() {
  document.getElementById("modal-letter").classList.add("hidden");
}

async function saveLetter() {
  appData.letter.body = document.getElementById("input-letter-body").value;
  appData.letter.sign = document.getElementById("input-letter-sign").value;
  closeLetterModal();
  await saveAppData();
}

// =========================================================================
// HIỆU ỨNG TRANG TRÍ (HEARTS & CONFETTI)
// =========================================================================
function createFloatingHearts() {
  const container = document.getElementById("hearts-container");
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

// Start
window.addEventListener("DOMContentLoaded", initApp);
