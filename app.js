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

  // Định dạng dd/mm/yyyy hoặc dd-mm-yyyy
  const vnMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (vnMatch) {
    const day = parseInt(vnMatch[1], 10);
    const month = parseInt(vnMatch[2], 10) - 1;
    const year = parseInt(vnMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Định dạng ISO yyyy-mm-dd (tương thích dữ liệu cũ đã lưu)
  const isoMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
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
    items: [
      "Trà sữa ít đường, nhiều trân châu",
      "Đồ ăn vặt chua ngọt và các món có phô mai",
      "Không thích ăn hành lá và đồ quá cay"
    ]
  },
  {
    id: "topic_hobbies",
    name: "Thú vui & Thói quen",
    icon: "🎨",
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
    body: "Gửi em bé của anh,\n\nAnh làm góc nhỏ này để mỗi khi em thấy mệt mỏi hay buồn chán, em có thể mở ra và thấy mình được yêu thương nhiều đến nhường nào.\n\nCảm ơn em vì đã luôn ở bên cạnh và làm cho những ngày bình thường của anh trở nên đặc biệt hơn bao giờ hết!",
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
let currentMode = "view"; // Mặc định luôn là 'view' (Tặng Em)
let isUnlocked = false;
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

// =========================================================================
// KHỞI TẠO & KẾT NỐI FIREBASE CLOUD
// =========================================================================
function initApp() {
  lucide.createIcons();
  createFloatingHearts();
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
// CÁC MỤC CHỦ ĐỀ VỀ EM (TOPIC NOTEBOOK)
// =========================================================================
function renderTopicsSection() {
  const topics = appData.topics || [];
  const tabsBar = document.getElementById("topic-tabs-bar");
  const panel = document.getElementById("active-topic-panel");

  if (topics.length === 0) {
    tabsBar.innerHTML = "";
    panel.innerHTML = `
      <div class="text-center py-8 text-gray-400 text-xs">
        Chưa có mục ghi chép nào. ${currentMode === "edit" ? "Bấm '+ Thêm Mục Mới' ở góc trên để tạo nhé!" : ""}
      </div>
    `;
    return;
  }

  if (!topics.some((t) => t.id === activeTopicId)) {
    activeTopicId = topics[0].id;
  }

  tabsBar.innerHTML = topics
    .map((t) => {
      const isActive = t.id === activeTopicId;
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
        </button>
      `;
    })
    .join("");

  const activeTopic = topics.find((t) => t.id === activeTopicId);
  const items = activeTopic.items || [];
  const isEdit = currentMode === "edit";

  const adminHeaderControls = isEdit
    ? `
      <div class="flex items-center gap-1.5">
        <button onclick="openTopicModal('${activeTopic.id}')" class="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-200" title="Đổi tên / icon mục">
          <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="deleteTopic('${activeTopic.id}')" class="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-200" title="Xóa mục này">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `
    : "";

  const itemsListHtml =
    items.length > 0
      ? items
          .map(
            (itemText, idx) => `
          <li class="flex items-start justify-between gap-3 p-3 rounded-2xl bg-pink-50/50 border border-pink-100/80 hover:bg-pink-50 transition">
            <div class="flex items-start gap-2.5">
              <span class="text-pink-500 font-bold text-sm mt-0.5">✦</span>
              <span class="text-sm text-gray-700 font-medium leading-relaxed">${escapeHtml(itemText)}</span>
            </div>
            ${
              isEdit
                ? `
              <div class="flex items-center gap-1 shrink-0">
                <button onclick="editTopicItem('${activeTopic.id}', ${idx})" class="p-1 rounded-md text-pink-500 hover:bg-pink-100" title="Sửa dòng này">
                  <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="deleteTopicItem('${activeTopic.id}', ${idx})" class="p-1 rounded-md text-rose-400 hover:bg-rose-100" title="Xóa dòng này">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            `
                : ""
            }
          </li>
        `
          )
          .join("")
      : `<p class="text-xs text-gray-400 italic py-4 text-center">Mục này chưa có ghi chú nào...</p>`;

  const addItemFormHtml = isEdit
    ? `
      <div class="mt-4 pt-3 border-t border-pink-100 flex items-center gap-2">
        <input
          type="text"
          id="new-topic-item-input"
          placeholder="Thêm một điều mới vào '${escapeHtml(activeTopic.name)}'..."
          class="flex-1 px-3.5 py-2 rounded-xl border border-pink-200 text-xs sm:text-sm focus:outline-none focus:border-pink-500"
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
      <div class="flex items-center justify-between gap-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${activeTopic.icon || "💖"}</span>
          <h4 class="font-bold text-base sm:text-lg text-gray-800">${escapeHtml(activeTopic.name)}</h4>
          <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-600">${items.length}</span>
        </div>
        ${adminHeaderControls}
      </div>

      <ul class="space-y-2">
        ${itemsListHtml}
      </ul>

      ${addItemFormHtml}
    </div>
  `;
  lucide.createIcons();
}

function selectTopicTab(topicId) {
  activeTopicId = topicId;
  renderTopicsSection();
}

async function addTopicItem(topicId) {
  const input = document.getElementById("new-topic-item-input");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const topic = appData.topics.find((t) => t.id === topicId);
  if (!topic) return;

  topic.items = topic.items || [];
  topic.items.push(text);
  input.value = "";
  await saveAppData();
}

async function editTopicItem(topicId, index) {
  const topic = appData.topics.find((t) => t.id === topicId);
  if (!topic || !topic.items[index]) return;

  const updated = prompt("Chỉnh sửa nội dung ghi chú:", topic.items[index]);
  if (updated === null) return;
  const trimmed = updated.trim();
  if (!trimmed) return;

  topic.items[index] = trimmed;
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
  const isEdit = currentMode === "edit";

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
                ? `<button onclick="deleteCoupon('${cp.id}')" class="p-1 rounded-lg text-rose-400 hover:bg-rose-100" title="Xóa phiếu">
                     <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                   </button>`
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

function openCouponModal() {
  document.getElementById("input-coupon-title").value = "";
  document.getElementById("input-coupon-desc").value = "";
  selectCouponIcon("🧋");
  document.getElementById("modal-coupon").classList.remove("hidden");
}

function closeCouponModal() {
  document.getElementById("modal-coupon").classList.add("hidden");
}

async function saveCoupon() {
  const title = document.getElementById("input-coupon-title").value.trim();
  const desc = document.getElementById("input-coupon-desc").value.trim();
  if (!title) {
    alert("Anh nhớ nhập tên phiếu quà tặng nhé!");
    return;
  }

  appData.coupons = appData.coupons || [];
  appData.coupons.push({
    id: "cp_" + Date.now(),
    icon: selectedCouponIcon,
    title,
    desc,
    used: false,
    usedAt: ""
  });

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
    alert("Chưa có thẻ bí mật nào trong hộp. Hãy chuyển sang chế độ 'Của Anh' để thêm nhé!");
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
  const text = prompt("Em muốn nhắn lại điều gì về kỷ niệm này cho anh biết không?", mem.gfReply || "");
  if (text === null) return;
  mem.gfReply = text.trim();
  await saveAppData();
}

// =========================================================================
// CHUYỂN CHẾ ĐỘ & XÁC THỰC MẬT KHẨU
// =========================================================================
function switchMode(mode) {
  currentMode = mode;
  const btnView = document.getElementById("btn-mode-view");
  const btnEdit = document.getElementById("btn-mode-edit");
  const adminEls = document.querySelectorAll(".admin-only");

  if (mode === "view") {
    btnView.className = "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-pink-500 text-white shadow-sm flex items-center gap-1.5";
    btnEdit.className = "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-pink-50 text-pink-600 hover:bg-pink-100 flex items-center gap-1.5";
    adminEls.forEach((el) => el.classList.add("hidden"));
    document.getElementById("admin-manage-drawer").classList.add("hidden");
  } else {
    btnEdit.className = "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-pink-500 text-white shadow-sm flex items-center gap-1.5";
    btnView.className = "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-pink-50 text-pink-600 hover:bg-pink-100 flex items-center gap-1.5";
    adminEls.forEach((el) => el.classList.remove("hidden"));
  }
  renderTopicsSection();
  renderCouponsSection();
  lucide.createIcons();
}

function requestEditMode() {
  if (isUnlocked) {
    switchMode("edit");
    return;
  }
  document.getElementById("input-admin-password").value = "";
  document.getElementById("password-error").classList.add("hidden");
  document.getElementById("modal-password").classList.remove("hidden");
  setTimeout(() => document.getElementById("input-admin-password").focus(), 100);
}

function closePasswordModal() {
  document.getElementById("modal-password").classList.add("hidden");
}

function verifyPassword() {
  const input = document.getElementById("input-admin-password").value.trim();
  const correct = appData.profile.adminPassword || "1234";
  if (input === correct) {
    isUnlocked = true;
    document.getElementById("edit-lock-icon").setAttribute("data-lucide", "unlock");
    closePasswordModal();
    switchMode("edit");
  } else {
    document.getElementById("password-error").classList.remove("hidden");
  }
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
    alert("Ngày bắt đầu yêu nhau chưa đúng định dạng dd/mm/yyyy (VD: 01/01/2025)");
    return;
  }

  if (rawEvent && !parseDateVN(rawEvent)) {
    alert("Ngày sự kiện đặc biệt chưa đúng định dạng dd/mm/yyyy (VD: 25/12/2026)");
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
