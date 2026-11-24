// =========================================================================
// BINDER TRƯNG BÀY THẺ POKÉMON (4x5 DISPLAY BINDER - 20 Ô / TRANG)
// =========================================================================
let binderCurrentPage = 1;
let currentZoomCardId = null;
let binderModalMode = "BULK"; // "BULK" | "SINGLE"
const BINDER_CARDS_PER_PAGE = 20; // Chuẩn 1 trang binder 4 cột ngang x 5 hàng dọc = 20 ô

function getPokemonCards() {
  return Array.isArray(appData.pokemonCards) ? appData.pokemonCards : [];
}

function renderBinderSection() {
  const grid = document.getElementById("pokemon-binder-grid");
  const statsEl = document.getElementById("binder-stats-badge");
  const paginationEl = document.getElementById("binder-pagination-bar");
  if (!grid) return;

  const allCards = getPokemonCards();
  const isEdit = isEditingAllowed();

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

      const imageContent = card.image
        ? `<img
             src="${escapeHtml(card.image)}"
             alt="${cardLabel}"
             loading="lazy"
             onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 250 350%22><rect width=%22250%22 height=%22350%22 fill=%22%23fdf2f8%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23db2777%22 font-family=%22sans-serif%22 font-size=%2214%22>Lỗi tải ảnh</text></svg>';"
             class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
           />`
        : `<div class="w-full h-full bg-gradient-to-br from-pink-100 via-rose-50 to-amber-50 flex flex-col items-center justify-center p-1.5 text-center">
             <span class="text-2xl mb-1">🎴</span>
             <span class="text-[10px] font-bold text-pink-700 line-clamp-2">${cardLabel}</span>
           </div>`;

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
                title="Đổi link / ghi chú"
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
          ${isEdit ? `onclick="openSinglePokemonModal()"` : ""}
          class="rounded-xl sm:rounded-2xl p-1 sm:p-1.5 bg-white/35 border border-dashed border-pink-200/80 flex flex-col ${
            isEdit ? "cursor-pointer hover:bg-pink-50/70 hover:border-pink-400 transition" : ""
          }"
        >
          <div class="w-full aspect-[5/7] rounded-lg sm:rounded-xl bg-pink-50/30 flex flex-col items-center justify-center text-center p-1">
            <span class="text-pink-300 text-sm sm:text-base mb-0.5">${isEdit ? "+" : "✨"}</span>
            <span class="text-[9px] sm:text-[10px] font-semibold text-pink-300 leading-tight">
              ${isEdit ? "Thêm thẻ" : "Trống"}
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

  const imgHtml = card.image
    ? `<img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.name || "Pokémon Card")}" class="w-full h-full object-cover" />`
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
// QUẢN LÝ THÊM NHANH HÀNG LOẠT & SỬA TỪNG THẺ
// =========================================================================
function switchBinderModalTab(mode) {
  binderModalMode = mode;
  const bulkTabBtn = document.getElementById("tab-btn-binder-bulk");
  const singleTabBtn = document.getElementById("tab-btn-binder-single");
  const bulkPanel = document.getElementById("panel-binder-bulk");
  const singlePanel = document.getElementById("panel-binder-single");

  if (mode === "BULK") {
    bulkTabBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-pink-500 text-white shadow-xs transition";
    singleTabBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-pink-50 text-pink-600 hover:bg-pink-100 transition";
    bulkPanel.classList.remove("hidden");
    singlePanel.classList.add("hidden");
  } else {
    singleTabBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-pink-500 text-white shadow-xs transition";
    bulkTabBtn.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-pink-50 text-pink-600 hover:bg-pink-100 transition";
    singlePanel.classList.remove("hidden");
    bulkPanel.classList.add("hidden");
  }
}

function openBulkPokemonModal() {
  document.getElementById("edit-pokemon-id").value = "";
  document.getElementById("pokemon-modal-tabs").classList.remove("hidden");
  document.getElementById("input-pokemon-bulk-urls").value = "";
  document.getElementById("bulk-url-counter").textContent = "0 link sẵn sàng";
  document.getElementById("input-pokemon-single-url").value = "";
  document.getElementById("input-pokemon-single-name").value = "";
  document.getElementById("single-pokemon-preview-box").classList.add("hidden");

  switchBinderModalTab("BULK");
  document.getElementById("modal-pokemon-card").classList.remove("hidden");
  lucide.createIcons();
}

function openSinglePokemonModal(cardId = null) {
  document.getElementById("edit-pokemon-id").value = cardId || "";
  const tabsEl = document.getElementById("pokemon-modal-tabs");

  if (cardId) {
    const card = getPokemonCards().find((c) => c.id === cardId);
    if (!card) return;
    tabsEl.classList.add("hidden");
    document.getElementById("input-pokemon-single-url").value = card.image || "";
    document.getElementById("input-pokemon-single-name").value = card.name || "";
    previewSinglePokemonUrl(card.image || "");
  } else {
    tabsEl.classList.remove("hidden");
    document.getElementById("input-pokemon-single-url").value = "";
    document.getElementById("input-pokemon-single-name").value = "";
    document.getElementById("single-pokemon-preview-box").classList.add("hidden");
  }

  switchBinderModalTab("SINGLE");
  document.getElementById("modal-pokemon-card").classList.remove("hidden");
  lucide.createIcons();
}

function closePokemonCardModal() {
  document.getElementById("modal-pokemon-card").classList.add("hidden");
}

function updateBulkUrlCounter(text) {
  const urls = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const counterEl = document.getElementById("bulk-url-counter");
  if (counterEl) {
    counterEl.textContent = `${urls.length} link sẵn sàng`;
  }
}

function previewSinglePokemonUrl(url) {
  const box = document.getElementById("single-pokemon-preview-box");
  const img = document.getElementById("single-pokemon-preview");
  const clean = url.trim();
  if (clean) {
    img.src = clean;
    box.classList.remove("hidden");
  } else {
    box.classList.add("hidden");
  }
}

async function savePokemonCardsFromModal() {
  appData.pokemonCards = getPokemonCards();
  const editId = document.getElementById("edit-pokemon-id").value;

  if (binderModalMode === "BULK" && !editId) {
    const rawText = document.getElementById("input-pokemon-bulk-urls").value;
    const urls = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (urls.length === 0) {
      alert("Anh dán ít nhất 1 link ảnh vào ô nhé!");
      return;
    }

    const baseTime = Date.now();
    urls.forEach((url, idx) => {
      appData.pokemonCards.push({
        id: `pkmn_${baseTime}_${idx}`,
        image: url,
        name: "",
        gfLiked: false
      });
    });

    binderCurrentPage = Math.ceil(appData.pokemonCards.length / BINDER_CARDS_PER_PAGE);
  } else {
    const url = document.getElementById("input-pokemon-single-url").value.trim();
    const name = document.getElementById("input-pokemon-single-name").value.trim();

    if (!url) {
      alert("Anh nhớ dán link ảnh thẻ Pokémon nhé!");
      return;
    }

    if (editId) {
      const card = appData.pokemonCards.find((c) => c.id === editId);
      if (card) {
        card.image = url;
        card.name = name;
      }
    } else {
      appData.pokemonCards.push({
        id: "pkmn_" + Date.now(),
        image: url,
        name,
        gfLiked: false
      });
      binderCurrentPage = Math.ceil(appData.pokemonCards.length / BINDER_CARDS_PER_PAGE);
    }
  }

  closePokemonCardModal();
  await saveAppData();
}

async function deletePokemonCard(cardId) {
  if (!confirm("Anh muốn xóa lá bài này khỏi Binder?")) return;
  appData.pokemonCards = getPokemonCards().filter((c) => c.id !== cardId);
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
