// =========================================================================
// ĐIỀU HƯỚNG DẠNG CUỐN SÁCH (MỤC LỤC & LẬT TRANG CHƯƠNG)
// =========================================================================
const BOOK_CHAPTERS = [
  {
    id: "notebook",
    elementId: "chapter-notebook",
    roman: "Chương I",
    pageNumber: 1,
    icon: "📖",
    title: "Tất Tần Tật Về Em",
    shortTitle: "Tất Tần Tật Về Em 📖",
    mysteryLabel: "Bí mật #1",
    desc: "Một cuốn sổ nhỏ ghi chép những điều anh luôn âm thầm để ý ở em...",
    accentBg: "from-pink-50 to-rose-50",
    accentBorder: "border-pink-200 hover:border-pink-400",
    badgeClass: "bg-pink-100 text-pink-700"
  },
  {
    id: "binder",
    elementId: "chapter-binder",
    roman: "Chương II",
    pageNumber: 2,
    icon: "🎴",
    title: "Binder Thẻ Pokémon Của Em",
    shortTitle: "Binder Thẻ Pokémon 🎴",
    mysteryLabel: "Bí mật #2",
    desc: "Một góc lấp lánh ánh kim anh cất giữ riêng dành cho em...",
    accentBg: "from-fuchsia-50 to-pink-50",
    accentBorder: "border-fuchsia-200 hover:border-fuchsia-400",
    badgeClass: "bg-fuchsia-100 text-fuchsia-700"
  },
  {
    id: "coupons",
    elementId: "chapter-coupons",
    roman: "Chương III",
    pageNumber: 3,
    icon: "🎟️",
    title: "Phiếu Đổi Quà Độc Quyền",
    shortTitle: "Phiếu Đổi Quà 🎟️",
    mysteryLabel: "Đặc quyền #3",
    desc: "Những tấm vé nhỏ chỉ có hiệu lực vô thời hạn với riêng mình em...",
    accentBg: "from-purple-50 to-pink-50",
    accentBorder: "border-purple-200 hover:border-purple-400",
    badgeClass: "bg-purple-100 text-purple-700"
  },
  {
    id: "memories",
    elementId: "chapter-memories",
    roman: "Chương IV",
    pageNumber: 4,
    icon: "✨",
    title: "Hộp Kỷ Niệm Bí Mật",
    shortTitle: "Hộp Kỷ Niệm Bí Mật ✨",
    mysteryLabel: "Hộp bí ẩn #4",
    desc: "Chạm để rút ngẫu nhiên một mảnh ký ức được giấu kín bên trong...",
    accentBg: "from-amber-50 to-rose-50",
    accentBorder: "border-amber-200 hover:border-amber-400",
    badgeClass: "bg-amber-100 text-amber-800"
  }
];

let currentBookView = "HOME"; // "HOME" | "notebook" | "binder" | "coupons" | "memories"
let hasOpenedLetterInSession = false;
let hasCelebratedAllChapters = false;
const visitedChaptersInSession = new Set();

function triggerBookFireworks() {
  if (typeof confetti !== "function") {
    if (typeof triggerHeartConfetti === "function") triggerHeartConfetti();
    return;
  }

  const colors = ["#ec4899", "#f43f5e", "#f9a8d4", "#fbbf24", "#c084fc", "#38bdf8"];

  // Đợt 1: Pháo hoa bắn lên từ 2 bên góc
  confetti({
    particleCount: 65,
    angle: 60,
    spread: 65,
    startVelocity: 52,
    origin: { x: 0.08, y: 0.85 },
    colors
  });
  confetti({
    particleCount: 65,
    angle: 120,
    spread: 65,
    startVelocity: 52,
    origin: { x: 0.92, y: 0.85 },
    colors
  });

  // Đợt 2: Pháo hoa nổ tung ở trung tâm phía trên
  setTimeout(() => {
    confetti({
      particleCount: 95,
      spread: 110,
      startVelocity: 42,
      ticks: 260,
      origin: { x: 0.5, y: 0.42 },
      colors
    });
  }, 260);

  // Đợt 3: Hai chùm pháo hoa tầm cao nối tiếp
  setTimeout(() => {
    confetti({
      particleCount: 70,
      spread: 95,
      startVelocity: 38,
      ticks: 240,
      origin: { x: 0.28, y: 0.48 },
      colors
    });
    confetti({
      particleCount: 70,
      spread: 95,
      startVelocity: 38,
      ticks: 240,
      origin: { x: 0.72, y: 0.48 },
      colors
    });
  }, 550);
}

function getAdminChapterStats(chapterId) {
  if (typeof appData === "undefined" || !appData) return "";

  if (chapterId === "notebook") {
    const topics = Array.isArray(appData.topics) ? appData.topics : [];
    const totalItems = topics.reduce((sum, t) => sum + ((t.items && t.items.length) || 0), 0);
    return `${topics.length} chủ đề • ${totalItems} điều`;
  }
  if (chapterId === "binder") {
    const cards = Array.isArray(appData.pokemonCards) ? appData.pokemonCards : [];
    return `${cards.length} lá bài`;
  }
  if (chapterId === "coupons") {
    const coupons = Array.isArray(appData.coupons) ? appData.coupons : [];
    const unused = coupons.filter((c) => !c.used).length;
    return `${unused}/${coupons.length} phiếu`;
  }
  if (chapterId === "memories") {
    const memories = Array.isArray(appData.memories) ? appData.memories : [];
    return `${memories.length} thẻ`;
  }
  return "";
}

function getChapterBadgeText(chapter, isEdit) {
  if (isEdit) {
    return getAdminChapterStats(chapter.id);
  }
  if (visitedChaptersInSession.has(chapter.id)) {
    return "Đã đọc ✨";
  }
  return `${chapter.mysteryLabel} 🔒`;
}

function updateBookTocVisibility() {
  const tocSection = document.getElementById("book-toc-section");
  const letterHint = document.getElementById("letter-unlock-toc-hint");
  if (!tocSection) return;

  const isEdit = typeof isEditingAllowed === "function" && isEditingAllowed();
  const shouldShowToc = isEdit || hasOpenedLetterInSession;

  if (shouldShowToc) {
    tocSection.classList.remove("hidden");
    if (letterHint) letterHint.classList.add("hidden");
  } else {
    tocSection.classList.add("hidden");
    if (letterHint) letterHint.classList.remove("hidden");
  }
}

function renderBookToc() {
  const grid = document.getElementById("book-toc-grid");
  if (!grid) return;

  const isEdit = typeof isEditingAllowed === "function" && isEditingAllowed();
  const totalChapters = BOOK_CHAPTERS.length;
  const visitedCount = visitedChaptersInSession.size;
  const allExplored = !isEdit && visitedCount >= totalChapters;

  grid.innerHTML = BOOK_CHAPTERS.map((ch) => {
    const badgeText = getChapterBadgeText(ch, isEdit);
    const isVisited = !isEdit && visitedChaptersInSession.has(ch.id);

    return `
      <button
        type="button"
        onclick="openBookChapter('${ch.id}')"
        class="group text-left p-4 rounded-2xl bg-gradient-to-br ${ch.accentBg} border-2 ${ch.accentBorder} shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
      >
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-pink-500">
              ${ch.roman} • Trang ${ch.pageNumber}
            </span>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isVisited ? "bg-emerald-100 text-emerald-700" : ch.badgeClass
            }">
              ${escapeHtml(badgeText)}
            </span>
          </div>

          <div class="flex items-center gap-2.5 mb-1.5">
            <span class="w-9 h-9 rounded-xl bg-white/90 border border-pink-100 flex items-center justify-center text-xl shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
              ${ch.icon}
            </span>
            <h4 class="font-bold text-sm sm:text-base text-gray-800 group-hover:text-pink-600 transition-colors leading-snug">
              ${escapeHtml(ch.title)}
            </h4>
          </div>

          <p class="text-xs text-gray-500 leading-relaxed">
            ${escapeHtml(ch.desc)}
          </p>
        </div>

        <div class="mt-3 pt-2 border-t border-pink-200/50 flex items-center justify-end text-[11px] font-bold text-pink-600">
          <span class="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Lật trang <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </span>
        </div>
      </button>
    `;
  }).join("");

  // Thanh trạng thái & lời chúc hoàn thành 4/4 chương ở Mục Lục (không dùng nút bấm)
  let footerEl = document.getElementById("book-toc-completion-footer");
  if (!footerEl && grid.parentElement) {
    footerEl = document.createElement("div");
    footerEl.id = "book-toc-completion-footer";
    grid.parentElement.appendChild(footerEl);
  }

  if (footerEl) {
    if (isEdit) {
      footerEl.innerHTML = "";
    } else if (allExplored) {
      footerEl.innerHTML = `
        <div class="mt-4 p-4 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border border-pink-200 flex items-center gap-3 animate-pop-in">
          <span class="text-2xl shrink-0">🎆</span>
          <div class="text-left">
            <div class="text-xs sm:text-sm font-bold text-pink-700">
              Chúc mừng em đã đọc trọn vẹn ${totalChapters}/${totalChapters} chương!
            </div>
            <div class="text-[11px] text-gray-600">
              Cảm ơn em vì đã dành thời gian khám phá hết những tâm tư nhỏ anh viết riêng cho em ❤️
            </div>
          </div>
        </div>
      `;
    } else if (visitedCount > 0) {
      footerEl.innerHTML = `
        <div class="mt-4 text-center text-[11px] font-bold text-pink-500">
          ✨ Em đã khám phá ${visitedCount}/${totalChapters} chương (đọc hết cả ${totalChapters} chương sẽ có bất ngờ nhé!)
        </div>
      `;
    } else {
      footerEl.innerHTML = "";
    }
  }

  updateBookTocVisibility();
  lucide.createIcons();
}

function renderChapterNavBars(chapterIdx) {
  const currentCh = BOOK_CHAPTERS[chapterIdx];
  if (!currentCh) return;

  const prevCh = chapterIdx > 0 ? BOOK_CHAPTERS[chapterIdx - 1] : null;
  const nextCh = chapterIdx < BOOK_CHAPTERS.length - 1 ? BOOK_CHAPTERS[chapterIdx + 1] : null;
  const totalPages = BOOK_CHAPTERS.length;

  // 1. Thanh điều hướng đầu trang sách
  const topBar = document.getElementById(`book-top-bar-${currentCh.id}`);
  if (topBar) {
    topBar.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-pink-100">
        <button
          type="button"
          onclick="backToBookToc()"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold transition"
        >
          <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
          <span>Về Mục Lục</span>
        </button>

        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold text-pink-500 uppercase tracking-wider">
            ${currentCh.roman}
          </span>
          <span class="px-3 py-1 rounded-full bg-pink-500 text-white text-xs font-bold shadow-2xs">
            Trang ${currentCh.pageNumber} / ${totalPages}
          </span>
        </div>
      </div>
    `;
  }

  // 2. Thanh lật trang cuối trang sách
  const bottomBar = document.getElementById(`book-bottom-bar-${currentCh.id}`);
  if (bottomBar) {
    const prevBtnHtml = prevCh
      ? `
        <button
          type="button"
          onclick="openBookChapter('${prevCh.id}')"
          class="flex-1 sm:flex-initial text-left px-3.5 py-2.5 rounded-2xl bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 shadow-2xs transition flex items-center gap-2 min-w-0"
        >
          <i data-lucide="arrow-left" class="w-4 h-4 shrink-0 text-pink-500"></i>
          <div class="min-w-0">
            <div class="text-[10px] font-bold uppercase text-pink-400">Trang trước (${prevCh.pageNumber}/${totalPages})</div>
            <div class="text-xs font-bold text-gray-700 truncate">${escapeHtml(prevCh.shortTitle)}</div>
          </div>
        </button>
      `
      : `
        <button
          type="button"
          onclick="backToBookToc()"
          class="flex-1 sm:flex-initial text-left px-3.5 py-2.5 rounded-2xl bg-white hover:bg-pink-50 text-pink-700 border border-pink-200 shadow-2xs transition flex items-center gap-2 min-w-0"
        >
          <i data-lucide="arrow-left" class="w-4 h-4 shrink-0 text-pink-500"></i>
          <div class="min-w-0">
            <div class="text-[10px] font-bold uppercase text-pink-400">Quay lại</div>
            <div class="text-xs font-bold text-gray-700 truncate">Mục Lục & Bức Thư 💌</div>
          </div>
        </button>
      `;

    const nextBtnHtml = nextCh
      ? `
        <button
          type="button"
          onclick="openBookChapter('${nextCh.id}')"
          class="flex-1 sm:flex-initial text-right px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white shadow-md transition flex items-center justify-end gap-2 min-w-0"
        >
          <div class="min-w-0">
            <div class="text-[10px] font-bold uppercase text-pink-100">Trang tiếp theo (${nextCh.pageNumber}/${totalPages})</div>
            <div class="text-xs font-bold text-white truncate">${escapeHtml(nextCh.shortTitle)}</div>
          </div>
          <i data-lucide="arrow-right" class="w-4 h-4 shrink-0"></i>
        </button>
      `
      : `
        <button
          type="button"
          onclick="backToBookToc()"
          class="flex-1 sm:flex-initial text-right px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white shadow-md transition flex items-center justify-end gap-2 min-w-0"
        >
          <div class="min-w-0">
            <div class="text-[10px] font-bold uppercase text-pink-100">Hoàn thành cuốn sách</div>
            <div class="text-xs font-bold text-white truncate">Quay về Mục Lục 🎆</div>
          </div>
          <i data-lucide="book-open" class="w-4 h-4 shrink-0"></i>
        </button>
      `;

    bottomBar.innerHTML = `
      <div class="mt-6 pt-4 border-t-2 border-dashed border-pink-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        ${prevBtnHtml}

        <button
          type="button"
          onclick="backToBookToc()"
          class="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
          title="Xem toàn bộ Mục Lục"
        >
          <i data-lucide="list" class="w-3.5 h-3.5"></i>
          <span>Mục Lục</span>
        </button>

        ${nextBtnHtml}
      </div>
    `;
  }
}

function openBookChapter(chapterId) {
  const chapterIdx = BOOK_CHAPTERS.findIndex((c) => c.id === chapterId);
  if (chapterIdx === -1) return;

  currentBookView = chapterId;
  hasOpenedLetterInSession = true;
  visitedChaptersInSession.add(chapterId);

  const homeView = document.getElementById("book-home-view");
  if (homeView) homeView.classList.add("hidden");

  BOOK_CHAPTERS.forEach((ch, idx) => {
    const el = document.getElementById(ch.elementId);
    if (!el) return;
    if (idx === chapterIdx) {
      el.classList.remove("hidden");
      el.classList.remove("animate-page-turn");
      void el.offsetWidth;
      el.classList.add("animate-page-turn");
      renderChapterNavBars(idx);
    } else {
      el.classList.add("hidden");
    }
  });

  lucide.createIcons();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function backToBookToc() {
  const wasInsideChapter = currentBookView !== "HOME";
  currentBookView = "HOME";

  BOOK_CHAPTERS.forEach((ch) => {
    const el = document.getElementById(ch.elementId);
    if (el) el.classList.add("hidden");
  });

  const homeView = document.getElementById("book-home-view");
  if (homeView) {
    homeView.classList.remove("hidden");
    homeView.classList.remove("animate-page-turn");
    void homeView.offsetWidth;
    homeView.classList.add("animate-page-turn");
  }

  renderBookToc();
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Tự động bắn pháo hoa ngay khi em đọc xong hết 4 chương và quay về Mục Lục
  const isEdit = typeof isEditingAllowed === "function" && isEditingAllowed();
  if (
    wasInsideChapter &&
    !isEdit &&
    !hasCelebratedAllChapters &&
    visitedChaptersInSession.size >= BOOK_CHAPTERS.length
  ) {
    hasCelebratedAllChapters = true;
    setTimeout(() => {
      triggerBookFireworks();
    }, 320);
  }
}

// =========================================================================
// TỰ ĐỘNG KẾT NỐI VỚI BỨC THƯ, DỮ LIỆU CLOUD & KHÓA SÁCH
// =========================================================================
(function initBookLifecycleHooks() {
  // 1. Khi mở Bức Thư -> hiện Mục Lục nhẹ nhàng bên dưới, KHÔNG tự cuộn làm lệch bức thư
  const origToggleSecretLetter = window.toggleSecretLetter;
  if (typeof origToggleSecretLetter === "function") {
    window.toggleSecretLetter = function (...args) {
      const box = document.getElementById("secret-letter-content");
      const willOpen = box && box.classList.contains("hidden");
      origToggleSecretLetter.apply(this, args);

      if (willOpen && !hasOpenedLetterInSession) {
        hasOpenedLetterInSession = true;
        renderBookToc();
      }
    };
  }

  const origRenderTopics = window.renderTopicsSection;
  if (typeof origRenderTopics === "function") {
    window.renderTopicsSection = function (...args) {
      origRenderTopics.apply(this, args);
      renderBookToc();
    };
  }

  const origRenderCoupons = window.renderCouponsSection;
  if (typeof origRenderCoupons === "function") {
    window.renderCouponsSection = function (...args) {
      origRenderCoupons.apply(this, args);
      renderBookToc();
    };
  }

  const origUpdateMystery = window.updateMysteryDeckStats;
  if (typeof origUpdateMystery === "function") {
    window.updateMysteryDeckStats = function (...args) {
      origUpdateMystery.apply(this, args);
      renderBookToc();
    };
  }

  const origToggleAdminPreview = window.toggleAdminPreview;
  if (typeof origToggleAdminPreview === "function") {
    window.toggleAdminPreview = function (...args) {
      origToggleAdminPreview.apply(this, args);
      if (typeof isEditingAllowed === "function" && !isEditingAllowed()) {
        visitedChaptersInSession.clear();
        hasCelebratedAllChapters = false;
        if (typeof hasCelebratedLetterOpen !== "undefined") {
          hasCelebratedLetterOpen = false;
        }
      }
      renderBookToc();
    };
  }

  const origLockGate = window.lockGate;
  if (typeof origLockGate === "function") {
    window.lockGate = function (...args) {
      hasOpenedLetterInSession = false;
      hasCelebratedAllChapters = false;
      if (typeof hasCelebratedLetterOpen !== "undefined") {
        hasCelebratedLetterOpen = false;
      }
      visitedChaptersInSession.clear();
      const letterBox = document.getElementById("secret-letter-content");
      const letterBtn = document.getElementById("btn-toggle-letter");
      if (letterBox) letterBox.classList.add("hidden");
      if (letterBtn) letterBtn.textContent = "Mở Phong Bì";
      backToBookToc();
      origLockGate.apply(this, args);
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderBookToc);
  } else {
    renderBookToc();
  }
})();
