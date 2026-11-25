// =========================================================================
// HỒ SƠ, BỨC THƯ BÍ MẬT & SÂN KHẤU RÚT THẺ KỶ NIỆM (POLAROID DECK)
// =========================================================================
const STICKERS = ["💖", "🥰", "🍓", "🧸", "🧋", "🌸", "✨", "🎀", "🐱", "🍰", "🌙", "💌"];

let unseenIds = [];
let currentRevealedId = null;
let selectedSticker = "💖";
let uploadedImageBase64 = "";

// =========================================================================
// RENDER HỒ SƠ & BỨC THƯ
// =========================================================================
function renderProfile() {
  const badgeEl = document.getElementById("display-badge");
  if (badgeEl) {
    badgeEl.textContent = appData.profile.badge || "✨ Sổ Tay Bí Mật Dành Riêng Cho Em ✨";
  }
  const titleEl = document.getElementById("display-title");
  if (titleEl) {
    titleEl.textContent = appData.profile.title || "Góc Nhỏ Về Em 💖";
  }
  const subtitleEl = document.getElementById("display-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = appData.profile.subtitle || "";
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const start = parseDateVN(appData.profile.startDate) || new Date(2025, 0, 1);
  const diffTime = Math.max(0, todayStart - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysCounterEl = document.getElementById("days-counter");
  const startDateDisplayEl = document.getElementById("start-date-display");
  if (daysCounterEl) daysCounterEl.textContent = diffDays.toLocaleString("vi-VN");
  if (startDateDisplayEl) startDateDisplayEl.textContent = `Từ ${formatDateVN(start)}`;

  const eventLabelEl = document.getElementById("special-event-label");
  const eventDaysEl = document.getElementById("special-event-days");
  const eventDateDisplayEl = document.getElementById("special-event-date-display");

  const eventName = appData.profile.eventName || "Ngày đặc biệt ✨";
  const targetDate = parseDateVN(appData.profile.eventDate);

  if (eventLabelEl) eventLabelEl.textContent = eventName;
  if (eventDaysEl && eventDateDisplayEl) {
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
}

function renderLetter() {
  const bodyEl = document.getElementById("letter-body-text");
  const signEl = document.getElementById("letter-sign-text");
  if (bodyEl) bodyEl.textContent = appData.letter.body || "";
  if (signEl) signEl.textContent = appData.letter.sign || "";
}

// =========================================================================
// SÂN KHẤU RÚT THẺ BÍ MẬT & PHẢN HỒI CỦA EM
// =========================================================================
function updateMysteryDeckStats() {
  const total = appData.memories.length;
  const isEdit = typeof isEditingAllowed === "function" && isEditingAllowed();
  const mysteryCountEl = document.getElementById("mystery-total-count");
  const adminCountEl = document.getElementById("admin-count");

  if (adminCountEl) adminCountEl.textContent = total;

  if (mysteryCountEl && mysteryCountEl.parentElement) {
    const descEl = mysteryCountEl.parentElement;
    if (isEdit) {
      descEl.innerHTML = `Có <strong id="mystery-total-count" class="underline decoration-wavy">${total}</strong> điều thú vị về em được giấu ở đây. Chạm để mở ngẫu nhiên từng thẻ nhé!`;
    } else {
      descEl.innerHTML = `<span id="mystery-total-count" class="hidden">${total}</span>Vô số điều thú vị về em đang được giấu kín bên trong. Chạm để rút ngẫu nhiên từng mảnh ký ức nhé!`;
    }
  }

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

  const isEdit = typeof isEditingAllowed === "function" && isEditingAllowed();
  const seenCount = total - unseenIds.length;
  const progressEl = document.getElementById("seen-progress-text");

  if (unseenIds.length === 0) {
    progressEl.textContent = isEdit
      ? `✨ Em đã mở hết ${total}/${total} bí mật rồi! Bấm tiếp để xáo lại từ đầu nhé.`
      : `✨ Em đã khám phá trọn vẹn mọi bí mật trong hộp rồi! Bấm tiếp để xáo lại từ đầu nhé.`;
    document.getElementById("draw-btn-label").textContent = "Xáo Lại Hộp Kỷ Niệm";
  } else {
    progressEl.textContent = isEdit
      ? `Đã mở ${seenCount}/${total} kỷ niệm bí mật`
      : `Đã mở ${seenCount} điều bí mật ✨ (vẫn còn bất ngờ đang chờ em...)`;
    document.getElementById("draw-btn-label").textContent = "Mở Một Điều Bất Ngờ Khác";
  }
}

function renderRevealedCard(mem, animate = true) {
  if (!mem) return;
  const stage = document.getElementById("revealed-stage");
  const slot = document.getElementById("revealed-card-slot");
  stage.classList.remove("hidden");

  const formattedDate = mem.date ? (formatDateVN(mem.date) || mem.date) : "";

  const imageHtml = mem.image
    ? `<div class="mb-4 rounded-xl overflow-hidden bg-pink-50 border border-pink-100">
         <img src="${mem.image}" alt="${escapeHtml(mem.title)}" class="w-full max-h-80 object-cover mx-auto" />
       </div>`
    : "";

  const reactions = ["🥰", "😂", "😭", "💖"];
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
        ${formattedDate ? `<span class="text-xs font-semibold text-pink-400">${escapeHtml(formattedDate)}</span>` : ""}
      </div>

      ${imageHtml}

      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg sm:text-xl font-bold text-gray-800 leading-snug">
          ${escapeHtml(mem.title)}
        </h3>
        <span class="text-3xl select-none shrink-0">${mem.sticker || "💖"}</span>
      </div>

      <p class="font-note text-xl sm:text-2xl text-gray-700 mt-3 leading-relaxed whitespace-pre-line">
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
  const isAdding = mem.gfReaction !== emoji;
  mem.gfReaction = isAdding ? emoji : "";
  if (isAdding) {
    triggerHeartConfetti();
    pushGfActivity("reaction", `Em vừa thả ${emoji} vào thẻ kỷ niệm "${mem.title}"`);
  }
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
  const cleanReply = dialogRes.text.trim();
  mem.gfReply = cleanReply;
  if (cleanReply) {
    pushGfActivity("reply", `Em vừa nhắn lại ở thẻ "${mem.title}": "${cleanReply}"`);
  }
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
  if (!picker) return;
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
    document.getElementById("mem-date").value = mem.date ? (formatDateVN(mem.date) || mem.date) : "";
    document.getElementById("mem-tag").value = mem.tag || "Kỷ niệm của tụi mình";
    document.getElementById("mem-note").value = mem.note || "";
    selectSticker(mem.sticker || "💖");
    uploadedImageBase64 = mem.image || "";
  } else {
    document.getElementById("memory-modal-title").innerHTML = `<i data-lucide="camera" class="w-5 h-5"></i> Thêm Thẻ Bí Mật`;
    document.getElementById("mem-title").value = "";
    document.getElementById("mem-date").value = "";
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

  const formattedDate = rawDate ? (formatDateVN(rawDate) || rawDate) : "";

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
  const badgeEl = document.getElementById("input-badge");
  const titleEl = document.getElementById("input-title");
  const subtitleEl = document.getElementById("input-subtitle");
  const startEl = document.getElementById("input-start-date");
  const eventNameEl = document.getElementById("input-event-name");
  const eventDateEl = document.getElementById("input-event-date");
  const passEl = document.getElementById("input-new-password");

  if (badgeEl) badgeEl.value = appData.profile.badge || "✨ Sổ Tay Bí Mật Dành Riêng Cho Em ✨";
  if (titleEl) titleEl.value = appData.profile.title || "";
  if (subtitleEl) subtitleEl.value = appData.profile.subtitle || "";
  if (startEl) startEl.value = formatDateVN(appData.profile.startDate) || "01/01/2025";
  if (eventNameEl) eventNameEl.value = appData.profile.eventName || "";
  if (eventDateEl) eventDateEl.value = formatDateVN(appData.profile.eventDate) || "";
  if (passEl) passEl.value = appData.profile.adminPassword || "";

  document.getElementById("modal-profile").classList.remove("hidden");
  lucide.createIcons();
}

function closeProfileModal() {
  document.getElementById("modal-profile").classList.add("hidden");
}

async function saveProfile() {
  const startEl = document.getElementById("input-start-date");
  const eventDateEl = document.getElementById("input-event-date");
  const rawStart = startEl ? startEl.value.trim() : "";
  const rawEvent = eventDateEl ? eventDateEl.value.trim() : "";

  if (rawStart && !parseDateVN(rawStart)) {
    alert("Ngày bắt đầu yêu nhau chưa hợp lệ (VD: 15082026 hoặc 15/08/2026)");
    return;
  }

  if (rawEvent && !parseDateVN(rawEvent)) {
    alert("Ngày sự kiện đặc biệt chưa hợp lệ (VD: 25/12/2026)");
    return;
  }

  const badgeEl = document.getElementById("input-badge");
  const titleEl = document.getElementById("input-title");
  const subtitleEl = document.getElementById("input-subtitle");
  const eventNameEl = document.getElementById("input-event-name");
  const newPassEl = document.getElementById("input-new-password");

  if (badgeEl) {
    appData.profile.badge = badgeEl.value.trim() || "✨ Sổ Tay Bí Mật Dành Riêng Cho Em ✨";
  }
  if (titleEl) {
    appData.profile.title = titleEl.value.trim() || "Góc Nhỏ Về Em 💖";
  }
  if (subtitleEl) {
    appData.profile.subtitle = subtitleEl.value.trim();
  }
  appData.profile.startDate = rawStart ? formatDateVN(rawStart) : "01/01/2025";
  if (eventNameEl) {
    appData.profile.eventName = eventNameEl.value.trim() || "Ngày đặc biệt ✨";
  }
  appData.profile.eventDate = rawEvent ? formatDateVN(rawEvent) : "";

  const newPass = newPassEl ? newPassEl.value.trim() : "";
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
