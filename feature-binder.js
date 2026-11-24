// =========================================================================
// BINDER TRƯNG BÀY THẺ POKÉMON (4x5 DISPLAY BINDER - DÁN ẢNH CHẤT LƯỢNG GỐC)
// =========================================================================
let binderCurrentPage = 1;
let currentZoomCardId = null;
let binderEditingCardId = null;
let stagedBinderImages = []; // Danh sách ảnh chờ lưu: [{ tempId, dataUrl, name, sizeLabel }]
const binderImageCache = {}; // Cache ảnh trong bộ nhớ: { [cardId]: dataUrl }
const binderLoadingIds = new Set();
const BINDER_CARDS_PER_PAGE = 20; // Chuẩn 1 trang binder 4 cột ngang x 5 hàng dọc = 20 ô
const MAX_FIRESTORE_IMAGE_CHARS = 960000; // Giới hạn an toàn dưới mức 1MB/document của Firestore

function getBinderFirestore() {
  if (typeof db !== "undefined" && db) return db;
  if (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0) {
    return firebase.firestore();
  }
  return null;
}

function getPokemonCards() {
  return Array.isArray(appData.pokemonCards) ? appData.pokemonCards : [];
}

function getLocalCachedCardImage(cardId) {
  try {
    return localStorage.getItem(`pkmn_cache_${cardId}`) || "";
  } catch (e) {
    return "";
  }
}

function setLocalCachedCardImage(cardId, dataUrl) {
  try {
    localStorage.setItem(`pkmn_cache_${cardId}`, dataUrl);
  } catch (e) {
    // Bỏ qua nếu localStorage đầy, dữ liệu chính vẫn nằm trên Firestore
  }
}

function removeLocalCachedCardImage(cardId) {
  try {
    localStorage.removeItem(`pkmn_cache_${cardId}`);
  } catch (e) {}
}

function getResolvedCardImage(card) {
  if (!card) return "";
  if (card.image) return card.image;
  if (binderImageCache[card.id]) return binderImageCache[card.id];
  const local = getLocalCachedCardImage(card.id);
  if (local) {
    binderImageCache[card.id] = local;
    return local;
  }
  return "";
}

async function syncBinderImagesFromCloud(cards) {
  const firestore = getBinderFirestore();
  if (!firestore || !Array.isArray(cards) || cards.length === 0) return;

  const missingCards = cards.filter(
    (c) => c && !c.image && !binderImageCache[c.id] && !binderLoadingIds.has(c.id)
  );
  if (missingCards.length === 0) return;

  missingCards.forEach((c) => binderLoadingIds.add(c.id));

  await Promise.all(
    missingCards.map(async (card) => {
      try {
        const snap = await firestore
          .collection("scrapbooks")
          .doc(`pkmn_img_${card.id}`)
          .get();
        if (snap.exists) {
          const data = snap.data();
          if (data && data.image) {
            binderImageCache[card.id] = data.image;
            setLocalCachedCardImage(card.id, data.image);
          }
        }
      } catch (err) {
        console.error("Lỗi tải ảnh thẻ Pokémon:", card.id, err);
      } finally {
        binderLoadingIds.delete(card.id);
      }
    })
  );

  renderBinderSection();
  if (currentZoomCardId) {
    openPokemonZoomModal(currentZoomCardId);
  }
}

function renderBinderSection() {
  const grid = document.getElementById("pokemon-binder-grid");
  const statsEl = document.getElementById("binder-stats-badge");
  const paginationEl = document.getElementById("binder-pagination-bar");
  if (!grid) return;

  const allCards = getPokemonCards();
  const isEdit = isEditingAllowed();

  // Kích hoạt tải ngầm các ảnh chưa có trong bộ nhớ
  syncBinderImagesFromCloud(allCards);

  const totalPages = Math.max(1, Math.ceil(allCards.length / BINDER_CARDS_PER_PAGE));
  if (binderCurrentPage > totalPages) binderCurrentPage = totalPages;
  if (binderCurrentPage < 1) binderCurrentPage = 1;

  if (statsEl) {
    statsEl.textContent = `${allCards.length} lá • ${totalPages} trang`;
  }

  const startIdx = (binderCurrentPage - 1) * BINDER_CARDS_PER_PAGE;
  const pageCards = allCards.slice(startIdx, startIdx + BINDER_CARDS_PER_PAGE);

  // Luôn render đủ 20 ô túi nhựa (4x5) trên mỗi trang binder
  const slotsHtml = [];
  for (let i = 0; i < BINDER_CARDS_PER_PAGE; i++) {
    const card = pageCards[i];
    if (card) {
      const globalIndex = startIdx + i;
      const cardLabel = card.name ? escapeHtml(card.name) : `Lá #${globalIndex + 1}`;
      const resolvedImg = getResolvedCardImage(card);
      const isLoading = !resolvedImg && binderLoadingIds.has(card.id);

      let imageContent = "";
      if (resolvedImg) {
        imageContent = `<img
             src="${resolvedImg}"
             alt="${cardLabel}"
             class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
           />`;
      } else if (isLoading) {
        imageContent = `<div class="w-full h-full bg-pink-50/80 animate-pulse flex flex-col items-center justify-center p-1.5 text-center">
             <span class="text-xl mb-1">✨</span>
             <span class="text-[9px] font-semibold text-pink-400">Đang tải...</span>
           </div>`;
      } else {
        imageContent = `<div class="w-full h-full bg-gradient-to-br from-pink-100 via-rose-50 to-amber-50 flex flex-col items-center justify-center p-1.5 text-center">
             <span class="text-2xl mb-1">🎴</span>
             <span class="text-[10px] font-bold text-pink-700 line-clamp-2">${cardLabel}</span>
           </div>`;
      }

      const adminBarHtml = isEdit
        ? `
          <div class="mt-1 flex items-center justify-between bg-pink-50/95 rounded-lg px-0.5 sm:px-1 py-0.5 border border-pink-100">
            <button
              onclick="movePokemonCard(${globalIndex}, -1)"
              ${globalIndex <= 0 ? "disabled" : ""}
              class="p-0.5 sm:p-1 rounded text-pink-600 hover:bg-pink-100 disabled:opacity-25"
              title="Chuyển sang trái"
            >
              <i data-lucide="arrow-left" class="w-2.5 h-2.5 sm:w-3 sm:h-3"></i>
            </button>
            <span class="text-[9px] sm:text-[10px] font-bold text-pink-400 select-none">#${globalIndex + 1}</span>
            <div class="flex items-center">
              <button
                onclick="openSinglePokemonModal('${card.id}')"
                class="p-0.5 sm:p-1 rounded text-pink-600 hover:bg-pink-100"
                title="Đổi ảnh / ghi chú"
              >
                <i data-lucide="pencil" class="w-2.5 h-2.5 sm:w-3 sm:h-3"></i>
              </button>
              <button
                onclick="deletePokemonCard('${card.id}')"
                class="p-0.5 sm:p-1 rounded text-rose-500 hover:bg-rose-100"
                title="Xóa lá này"
              >
                <i data-lucide="trash-2" class="w-2.5 h-2.5 sm:w-3 sm:h-3"></i>
              </button>
              <button
                onclick="movePokemonCard(${globalIndex}, 1)"
                ${globalIndex >= allCards.length - 1 ? "disabled" : ""}
                class="p-0.5 sm:p-1 rounded text-pink-600 hover:bg-pink-100 disabled:opacity-25"
                title="Chuyển sang phải"
              >
                <i data-lucide="arrow-right" class="w-2.5 h-2.5 sm:w-3 sm:h-3"></i>
              </button>
            </div>
          </div>
        `
        : "";

      slotsHtml.push(`
        <div class="pokemon-pocket group relative rounded-xl sm:rounded-2xl p-1 sm:p-1.5 bg-white/85 border border-pink-200/80 shadow-xs hover:shadow-md transition-all flex flex-col">
          <!-- Túi nhựa đựng thẻ chuẩn tỉ lệ 5:7 -->
          <div
            onclick="openPokemonZoomModal('${card.id}')"
            class="pokemon-sleeve-card pokemon-holo-shine relative w-full aspect-[5/7] rounded-lg sm:rounded-xl overflow-hidden bg-pink-50 cursor-pointer"
          >
            ${imageContent}

            ${
              card.gfLiked
                ? `<span class="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-500/95 text-white text-[10px] sm:text-xs flex items-center justify-center shadow-md pointer-events-none">💖</span>`
                : ""
            }
          </div>
          ${adminBarHtml}
        </div>
      `);
    } else {
      // Ô nhựa trong suốt còn trống
      slotsHtml.push(`
        <div
          ${isEdit ? `onclick="openBulkPokemonModal()"` : ""}
          class="rounded-xl sm:rounded-2xl p-1 sm:p-1.5 bg-white/35 border border-dashed border-pink-200/80 flex flex-col ${
            isEdit ? "cursor-pointer hover:bg-pink-50/70 hover:border-pink-400 transition" : ""
          }"
        >
          <div class="w-full aspect-[5/7] rounded-lg sm:rounded-xl bg-pink-50/30 flex flex-col items-center justify-center text-center p-1">
            <span class="text-pink-300 text-sm sm:text-base mb-0.5">${isEdit ? "+" : "✨"}</span>
            <span class="text-[9px] sm:text-[10px] font-semibold text-pink-300 leading-tight">
              ${isEdit ? "Dán ảnh" : "Trống"}
            </span>
          </div>
        </div>
      `);
    }
  }

  grid.innerHTML = slotsHtml.join("");

  // Thanh lật trang Binder
  if (paginationEl) {
    paginationEl.innerHTML = `
      <button
        onclick="changeBinderPage(-1)"
        ${binderCurrentPage <= 1 ? "disabled" : ""}
        class="px-3.5 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1 ${
          binderCurrentPage <= 1
            ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
            : "bg-white text-pink-600 border-pink-200 hover:bg-pink-50 shadow-xs"
        }"
      >
        <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
        <span>Trang trước</span>
      </button>

      <div class="flex items-center gap-1.5">
        ${Array.from({ length: totalPages }, (_, idx) => {
          const p = idx + 1;
          const active = p === binderCurrentPage;
          return `
            <button
              onclick="goToBinderPage(${p})"
              class="w-7 h-7 rounded-full text-xs font-bold transition ${
                active
                  ? "bg-pink-500 text-white shadow-xs"
                  : "bg-white text-pink-600 border border-pink-200 hover:bg-pink-50"
              }"
            >
              ${p}
            </button>
          `;
        }).join("")}
      </div>

      <button
        onclick="changeBinderPage(1)"
        ${binderCurrentPage >= totalPages ? "disabled" : ""}
        class="px-3.5 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1 ${
          binderCurrentPage >= totalPages
            ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
            : "bg-white text-pink-600 border-pink-200 hover:bg-pink-50 shadow-xs"
        }"
      >
        <span>Trang sau</span>
        <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
      </button>
    `;
  }

  lucide.createIcons();
}

function changeBinderPage(delta) {
  binderCurrentPage += delta;
  renderBinderSection();
}

function goToBinderPage(pageNum) {
  binderCurrentPage = pageNum;
  renderBinderSection();
}

async function togglePokemonCardHeart(cardId) {
  const card = getPokemonCards().find((c) => c.id === cardId);
  if (!card) return;

  card.gfLiked = !card.gfLiked;
  if (card.gfLiked) {
    triggerHeartConfetti();
    const idx = getPokemonCards().findIndex((c) => c.id === cardId);
    const label = card.name ? `"${card.name}"` : `số #${idx + 1}`;
    pushGfActivity("pokemon", `Em vừa thả tim lá bài Pokémon ${label} trong Binder 💖`);
  }
  await saveAppData();
}

// =========================================================================
// MODAL PHÓNG TO & LƯỚT TỪNG LÁ BÀI (LIGHTBOX)
// =========================================================================
function openPokemonZoomModal(cardId) {
  const allCards = getPokemonCards();
  const idx = allCards.findIndex((c) => c.id === cardId);
  if (idx === -1) return;

  currentZoomCardId = cardId;
  const card = allCards[idx];
  const modal = document.getElementById("modal-pokemon-zoom");
  const slot = document.getElementById("pokemon-zoom-content");
  if (!modal || !slot) return;

  const hasPrev = idx > 0;
  const hasNext = idx < allCards.length - 1;
  const resolvedImg = getResolvedCardImage(card);

  const imgHtml = resolvedImg
    ? `<img
         src="${resolvedImg}"
         alt="${escapeHtml(card.name || "Pokémon Card")}"
         class="w-full h-full object-cover"
       />`
    : `<div class="w-full h-full bg-gradient-to-br from-pink-100 via-rose-50 to-amber-50 flex flex-col items-center justify-center p-4 text-center">
         <span class="text-5xl mb-2">🎴</span>
       </div>`;

  slot.innerHTML = `
    <div class="flex flex-col items-center">
      <!-- Top Counter -->
      <div class="w-full flex items-center justify-between mb-3">
        <span class="px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-bold border border-pink-100">
          Lá ${idx + 1} / ${allCards.length}
        </span>
        <button
          onclick="closePokemonZoomModal()"
          class="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-pink-100 hover:text-pink-600 flex items-center justify-center text-sm font-bold transition"
          title="Đóng"
        >
          ✕
        </button>
      </div>

      <!-- Card Image + Prev/Next Controls -->
      <div class="flex items-center justify-center gap-2 sm:gap-3 w-full">
        <button
          onclick="navigatePokemonZoom(-1)"
          ${!hasPrev ? "disabled" : ""}
          class="w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition ${
            hasPrev
              ? "bg-white text-pink-600 border-pink-200 hover:bg-pink-50 shadow-sm"
              : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
          }"
          title="Lá trước"
        >
          <i data-lucide="chevron-left" class="w-5 h-5"></i>
        </button>

        <div class="pokemon-holo-shine w-56 sm:w-64 aspect-[5/7] rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-pink-50 relative">
          ${imgHtml}
        </div>

        <button
          onclick="navigatePokemonZoom(1)"
          ${!hasNext ? "disabled" : ""}
          class="w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition ${
            hasNext
              ? "bg-white text-pink-600 border-pink-200 hover:bg-pink-50 shadow-sm"
              : "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
          }"
          title="Lá tiếp theo"
        >
          <i data-lucide="chevron-right" class="w-5 h-5"></i>
        </button>
      </div>

      ${
        card.name
          ? `<p class="mt-3 text-sm font-bold text-gray-800 text-center">${escapeHtml(card.name)}</p>`
          : ""
      }

      <!-- Girlfriend Like Button -->
      <div class="mt-4 flex items-center justify-center">
        <button
          onclick="togglePokemonCardHeart('${card.id}'); openPokemonZoomModal('${card.id}');"
          class="px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
            card.gfLiked
              ? "bg-rose-500 text-white shadow-md"
              : "bg-pink-100 text-pink-700 hover:bg-pink-200"
          }"
        >
          <span>${card.gfLiked ? "💖 Em đã thả tim lá này" : "🤍 Thả tim lá bài này"}</span>
        </button>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  lucide.createIcons();
}

function navigatePokemonZoom(delta) {
  const allCards = getPokemonCards();
  const idx = allCards.findIndex((c) => c.id === currentZoomCardId);
  if (idx === -1) return;
  const target = allCards[idx + delta];
  if (target) {
    openPokemonZoomModal(target.id);
  }
}

function closePokemonZoomModal() {
  currentZoomCardId = null;
  const modal = document.getElementById("modal-pokemon-zoom");
  if (modal) modal.classList.add("hidden");
}

// =========================================================================
// ĐỌC ẢNH TỪ CLIPBOARD / FILE GIỮ NGUYÊN CHẤT LƯỢNG GỐC 100%
// =========================================================================
function readBlobAsOriginalDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Không đọc được dữ liệu ảnh"));
    reader.readAsDataURL(blob);
  });
}

// Chỉ chuyển đổi định dạng không mất nét nếu 1 tấm ảnh vượt trần 1MB của Firestore
async function ensureFirestoreSafeOriginalImage(blob) {
  const rawDataUrl = await readBlobAsOriginalDataUrl(blob);
  if (rawDataUrl.length <= MAX_FIRESTORE_IMAGE_CHARS) {
    return rawDataUrl; // Giữ nguyên 100% từng byte ảnh gốc
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const qualities = [1.0, 0.96, 0.92, 0.88];
      for (const q of qualities) {
        const webpData = canvas.toDataURL("image/webp", q);
        if (webpData.length <= MAX_FIRESTORE_IMAGE_CHARS) {
          resolve(webpData);
          return;
        }
      }
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

async function processIncomingImageFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) => f && f.type && f.type.startsWith("image/"));
  if (files.length === 0) return 0;

  for (const file of files) {
    const dataUrl = await ensureFirestoreSafeOriginalImage(file);
    const kb = Math.round((dataUrl.length * 0.75) / 1024);

    if (binderEditingCardId) {
      // Chế độ thay ảnh cho 1 thẻ đang sửa
      stagedBinderImages = [
        {
          tempId: "edit_" + Date.now(),
          dataUrl,
          sizeLabel: `${kb} KB • Gốc`
        }
      ];
    } else {
      // Chế độ thêm nhiều thẻ liên tiếp
      stagedBinderImages.push({
        tempId: `stage_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        dataUrl,
        sizeLabel: `${kb} KB • Gốc`
      });
    }
  }

  renderStagedBinderImages();
  return files.length;
}

function renderStagedBinderImages() {
  const counterEl = document.getElementById("staged-images-counter");
  const gridEl = document.getElementById("pokemon-staged-grid");
  const clearAllBtn = document.getElementById("btn-clear-staged-images");
  if (!gridEl) return;

  if (counterEl) {
    counterEl.textContent = binderEditingCardId
      ? stagedBinderImages.length > 0
        ? "Đã chọn ảnh thay thế"
        : "Đang dùng ảnh hiện tại"
      : `${stagedBinderImages.length} ảnh sẵn sàng`;
  }

  if (clearAllBtn) {
    if (!binderEditingCardId && stagedBinderImages.length > 0) {
      clearAllBtn.classList.remove("hidden");
    } else {
      clearAllBtn.classList.add("hidden");
    }
  }

  if (stagedBinderImages.length === 0) {
    gridEl.innerHTML = "";
    gridEl.classList.add("hidden");
    return;
  }

  gridEl.classList.remove("hidden");
  gridEl.innerHTML = stagedBinderImages
    .map(
      (item, idx) => `
      <div class="relative group rounded-xl overflow-hidden border-2 border-pink-200 bg-pink-50 aspect-[5/7] shadow-2xs">
        <img src="${item.dataUrl}" alt="Ảnh ${idx + 1}" class="w-full h-full object-cover" />
        <span class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-bold">
          #${idx + 1}
        </span>
        <button
          type="button"
          onclick="removeStagedBinderImage('${item.tempId}')"
          class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center shadow hover:bg-rose-600 transition"
          title="Bỏ ảnh này"
        >
          ✕
        </button>
      </div>
    `
    )
    .join("");
}

function removeStagedBinderImage(tempId) {
  stagedBinderImages = stagedBinderImages.filter((item) => item.tempId !== tempId);
  renderStagedBinderImages();
}

function clearAllStagedBinderImages() {
  stagedBinderImages = [];
  renderStagedBinderImages();
}

async function pasteImageFromClipboardButton() {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    alert("Anh nhấn tổ hợp phím Ctrl + V (hoặc Cmd + V trên Mac) để dán ảnh vừa copy nhé!");
    return;
  }

  try {
    const clipboardItems = await navigator.clipboard.read();
    const imageBlobs = [];
    for (const item of clipboardItems) {
      const imgType = item.types.find((t) => t.startsWith("image/"));
      if (imgType) {
        const blob = await item.getType(imgType);
        imageBlobs.push(blob);
      }
    }

    if (imageBlobs.length === 0) {
      alert("Trong bộ nhớ tạm chưa có ảnh nào. Anh chuột phải vào ảnh trên mạng chọn 'Sao chép hình ảnh' trước nhé!");
      return;
    }

    await processIncomingImageFiles(imageBlobs);
  } catch (err) {
    alert("Anh nhấn trực tiếp Ctrl + V (hoặc Cmd + V) trên bàn phím để dán ảnh vào khung nhé!");
  }
}

function handleBinderFileInput(event) {
  if (event.target && event.target.files) {
    processIncomingImageFiles(event.target.files);
    event.target.value = "";
  }
}

function handleBinderDrop(event) {
  event.preventDefault();
  const zone = document.getElementById("pokemon-paste-dropzone");
  if (zone) zone.classList.remove("border-pink-500", "bg-pink-100/70");

  if (event.dataTransfer && event.dataTransfer.files) {
    processIncomingImageFiles(event.dataTransfer.files);
  }
}

// =========================================================================
// MỞ / ĐÓNG & LƯU MODAL DÁN ẢNH THẺ POKÉMON
// =========================================================================
function openBulkPokemonModal() {
  binderEditingCardId = null;
  stagedBinderImages = [];

  const titleEl = document.getElementById("pokemon-modal-heading");
  if (titleEl) titleEl.textContent = "Dán Ảnh Thẻ Pokémon Vào Binder";

  const editNameBox = document.getElementById("pokemon-single-edit-fields");
  if (editNameBox) editNameBox.classList.add("hidden");

  const progressEl = document.getElementById("pokemon-save-progress");
  if (progressEl) progressEl.classList.add("hidden");

  renderStagedBinderImages();
  document.getElementById("modal-pokemon-card").classList.remove("hidden");
  lucide.createIcons();
}

function openSinglePokemonModal(cardId) {
  const card = getPokemonCards().find((c) => c.id === cardId);
  if (!card) return;

  binderEditingCardId = cardId;
  const existingImg = getResolvedCardImage(card);
  stagedBinderImages = existingImg
    ? [{ tempId: "current", dataUrl: existingImg, sizeLabel: "Ảnh hiện tại" }]
    : [];

  const titleEl = document.getElementById("pokemon-modal-heading");
  if (titleEl) titleEl.textContent = "Chỉnh Sửa Lá Bài Pokémon";

  const editNameBox = document.getElementById("pokemon-single-edit-fields");
  if (editNameBox) editNameBox.classList.remove("hidden");

  const nameInput = document.getElementById("input-pokemon-single-name");
  if (nameInput) nameInput.value = card.name || "";

  const progressEl = document.getElementById("pokemon-save-progress");
  if (progressEl) progressEl.classList.add("hidden");

  renderStagedBinderImages();
  document.getElementById("modal-pokemon-card").classList.remove("hidden");
  lucide.createIcons();
}

function closePokemonCardModal() {
  binderEditingCardId = null;
  stagedBinderImages = [];
  document.getElementById("modal-pokemon-card").classList.add("hidden");
}

async function savePokemonCardsFromModal() {
  const firestore = getBinderFirestore();
  if (!firestore) {
    alert("Chưa kết nối được Firebase Firestore, anh đợi 1-2 giây rồi thử lại nhé!");
    return;
  }

  const saveBtn = document.getElementById("btn-save-pokemon-cards");
  const progressEl = document.getElementById("pokemon-save-progress");
  appData.pokemonCards = getPokemonCards();

  if (binderEditingCardId) {
    const card = appData.pokemonCards.find((c) => c.id === binderEditingCardId);
    if (!card) return;

    const nameInput = document.getElementById("input-pokemon-single-name");
    card.name = nameInput ? nameInput.value.trim() : "";

    const newImage = stagedBinderImages[0] ? stagedBinderImages[0].dataUrl : "";
    if (!newImage) {
      alert("Anh dán hoặc chọn 1 ảnh cho lá bài này nhé!");
      return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (progressEl) {
      progressEl.textContent = "Đang lưu ảnh chất lượng gốc lên Cloud...";
      progressEl.classList.remove("hidden");
    }

    try {
      await firestore
        .collection("scrapbooks")
        .doc(`pkmn_img_${card.id}`)
        .set({ image: newImage, updatedAt: Date.now() });

      delete card.image; // Chỉ giữ metadata nhẹ trong main_scrapbook
      card.hasCloudImage = true;
      binderImageCache[card.id] = newImage;
      setLocalCachedCardImage(card.id, newImage);

      closePokemonCardModal();
      await saveAppData();
    } catch (err) {
      console.error(err);
      alert("Lưu ảnh chưa thành công, anh thử lại nhé!");
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
    return;
  }

  // Lưu hàng loạt ảnh vừa dán
  if (stagedBinderImages.length === 0) {
    alert("Anh nhấn Ctrl + V để dán ít nhất 1 ảnh vào khung trước khi lưu nhé!");
    return;
  }

  if (saveBtn) saveBtn.disabled = true;
  if (progressEl) progressEl.classList.remove("hidden");

  try {
    const total = stagedBinderImages.length;
    const baseTime = Date.now();

    for (let i = 0; i < total; i++) {
      const item = stagedBinderImages[i];
      const cardId = `pkmn_${baseTime}_${i}`;

      if (progressEl) {
        progressEl.textContent = `Đang lưu ảnh gốc ${i + 1} / ${total} lên Cloud...`;
      }

      await firestore
        .collection("scrapbooks")
        .doc(`pkmn_img_${cardId}`)
        .set({ image: item.dataUrl, updatedAt: Date.now() });

      binderImageCache[cardId] = item.dataUrl;
      setLocalCachedCardImage(cardId, item.dataUrl);

      appData.pokemonCards.push({
        id: cardId,
        name: "",
        gfLiked: false,
        hasCloudImage: true
      });
    }

    binderCurrentPage = Math.ceil(appData.pokemonCards.length / BINDER_CARDS_PER_PAGE);
    closePokemonCardModal();
    await saveAppData();
  } catch (err) {
    console.error(err);
    alert("Có lỗi khi tải ảnh lên Cloud, anh thử lại nhé!");
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function deletePokemonCard(cardId) {
  if (!confirm("Anh muốn xóa lá bài này khỏi Binder?")) return;

  appData.pokemonCards = getPokemonCards().filter((c) => c.id !== cardId);
  delete binderImageCache[cardId];
  removeLocalCachedCardImage(cardId);

  const firestore = getBinderFirestore();
  if (firestore) {
    firestore
      .collection("scrapbooks")
      .doc(`pkmn_img_${cardId}`)
      .delete()
      .catch(() => {});
  }

  await saveAppData();
}

async function movePokemonCard(index, direction) {
  const list = getPokemonCards();
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= list.length) return;

  const temp = list[index];
  list[index] = list[targetIndex];
  list[targetIndex] = temp;

  await saveAppData();
}

// =========================================================================
// LẮNG NGHE SỰ KIỆN CTRL+V / CMD+V TOÀN TRANG KHI ĐANG Ở CHẾ ĐỘ ADMIN
// =========================================================================
document.addEventListener("paste", async (event) => {
  if (typeof isEditingAllowed !== "function" || !isEditingAllowed()) return;

  const items = event.clipboardData && event.clipboardData.items;
  if (!items) return;

  const imageFiles = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].type && items[i].type.startsWith("image/")) {
      const file = items[i].getAsFile();
      if (file) imageFiles.push(file);
    }
  }

  if (imageFiles.length === 0) return;

  const modal = document.getElementById("modal-pokemon-card");
  const isModalOpen = modal && !modal.classList.contains("hidden");

  if (isModalOpen) {
    event.preventDefault();
    await processIncomingImageFiles(imageFiles);
    return;
  }

  // Nếu modal đang đóng nhưng anh đang mở chương Binder và nhấn Ctrl+V ảnh
  const binderChapter = document.getElementById("chapter-binder");
  const isBinderVisible = binderChapter && !binderChapter.classList.contains("hidden");
  const activeTag = document.activeElement && document.activeElement.tagName;
  const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA";

  if (isBinderVisible && !isTyping) {
    event.preventDefault();
    openBulkPokemonModal();
    await processIncomingImageFiles(imageFiles);
  }
});

// =========================================================================
// TỰ ĐỘNG ĐỒNG BỘ KHI DỮ LIỆU CLOUD HOẶC CHẾ ĐỘ XEM THỬ THAY ĐỔI
// =========================================================================
(function hookBinderLifecycle() {
  const origRenderCoupons = window.renderCouponsSection;
  if (typeof origRenderCoupons === "function") {
    window.renderCouponsSection = function (...args) {
      origRenderCoupons.apply(this, args);
      renderBinderSection();
    };
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderBinderSection);
  } else {
    renderBinderSection();
  }
})();
