// =========================================================================
// CÁC MỤC CHỦ ĐỀ VỀ EM (TOPIC NOTEBOOK) & PHIẾU ĐỔI QUÀ (LOVE COUPONS)
// =========================================================================
const TOPIC_ICONS = ["🏷️", "🍜", "🧋", "🎮", "🎨", "🎵", "💤", "🚫", "🌸", "🧸", "✨", "💬"];
const COUPON_ICONS = ["🧋", "🎟️", "💆‍♀️", "🛵", "🍦", "🎬", "🧸", "💐", "🫂", "👑"];

let activeTopicId = "topic_nicknames";
let activeSubGroupFilter = "ALL";
let selectedTopicIcon = "🏷️";
let selectedCouponIcon = "🧋";
let expandedTopicIds = new Set();
let topicSearchQuery = "";
let selectedNewItemGroup = "";
const TOPIC_COLLAPSE_LIMIT = 6;

function normalizeTopicItem(item) {
  if (typeof item === "string") {
    return { text: item, group: "" };
  }
  return {
    text: String(item.text || ""),
    group: String(item.group || "")
  };
}

function renderSingleTopicCardHtml(topicId, entry, idx, totalInTopic, isLastOddCard, isEdit, groupList = []) {
  const canMoveUp = idx > 0;
  const canMoveDown = idx < totalInTopic - 1;
  const spanClass = isLastOddCard ? "sm:col-span-2" : "";

  const quickGroupSelectHtml =
    isEdit && Array.isArray(groupList) && groupList.length > 0
      ? `
        <select
          onchange="quickAssignTopicItemGroup('${topicId}', ${idx}, this.value)"
          class="max-w-[105px] px-1.5 py-0.5 rounded-lg bg-white border border-pink-200 text-[10px] font-semibold text-pink-700 focus:outline-none focus:border-pink-400"
          title="Đổi nhanh nhóm nhỏ"
        >
          <option value="">Chung</option>
          ${groupList
            .map(
              (g) =>
                `<option value="${escapeHtml(g)}" ${entry.group === g ? "selected" : ""}>${escapeHtml(g)}</option>`
            )
            .join("")}
        </select>
      `
      : "";

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
          ${quickGroupSelectHtml}
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
    activeSubGroupFilter = "ALL";
  }

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

  if (
    activeSubGroupFilter !== "ALL" &&
    activeSubGroupFilter !== "__UNGROUPED__" &&
    !groupList.includes(activeSubGroupFilter)
  ) {
    activeSubGroupFilter = "ALL";
  }

  const canMoveTabLeft = activeIndex > 0;
  const canMoveTabRight = activeIndex < topics.length - 1;

  const queryNorm = topicSearchQuery.trim().toLowerCase();
  const filteredItems = normalizedItems.filter(
    (entry) =>
      !queryNorm ||
      entry.text.toLowerCase().includes(queryNorm) ||
      entry.group.toLowerCase().includes(queryNorm)
  );

  const hasSubGroups = groupList.length > 0;

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

  const ungroupedCount = filteredItems.filter((it) => !it.group || !groupList.includes(it.group)).length;
  const subGroupsNavHtml = hasSubGroups
    ? `
      <div class="flex flex-wrap items-center gap-1.5 mb-3 p-2.5 rounded-2xl bg-pink-50/70 border border-pink-100">
        <button
          onclick="selectSubGroupFilter('ALL')"
          class="px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
            activeSubGroupFilter === "ALL"
              ? "bg-pink-500 text-white shadow-xs"
              : "bg-white text-pink-700 border border-pink-200 hover:bg-pink-100"
          }"
        >
          Tất cả (${filteredItems.length})
        </button>
        ${groupList
          .map((g) => {
            const gCount = filteredItems.filter((it) => it.group === g).length;
            const isSelected = activeSubGroupFilter === g;
            return `
              <span class="inline-flex items-center rounded-full border transition ${
                isSelected
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
              }">
                <button
                  onclick="selectSubGroupFilter('${escapeHtml(g).replace(/'/g, "\\'")}')"
                  class="px-2.5 py-1 text-[11px] font-bold flex items-center gap-1"
                >
                  <span>${escapeHtml(g)}</span>
                  <span class="opacity-80">(${gCount})</span>
                </button>
                ${
                  isEdit
                    ? `<button onclick="removeTopicSubGroup('${activeTopic.id}', '${escapeHtml(g).replace(/'/g, "\\'")}')" class="pr-2 pl-0.5 text-[10px] opacity-70 hover:opacity-100" title="Gỡ nhóm này">✕</button>`
                    : ""
                }
              </span>
            `;
          })
          .join("")}
        ${
          ungroupedCount > 0
            ? `
              <button
                onclick="selectSubGroupFilter('__UNGROUPED__')"
                class="px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                  activeSubGroupFilter === "__UNGROUPED__"
                    ? "bg-gray-600 text-white shadow-xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }"
              >
                Chung (${ungroupedCount})
              </button>
            `
            : ""
        }
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

    if (activeSubGroupFilter === "ALL") {
      groupList.forEach((g) => {
        const bucketItems = filteredItems.filter((it) => it.group === g);
        orderedBuckets.push({ title: g, items: bucketItems });
      });

      const ungroupedItems = filteredItems.filter((it) => !it.group || !groupList.includes(it.group));
      if (ungroupedItems.length > 0) {
        orderedBuckets.push({ title: "Chung", items: ungroupedItems });
      }
    } else if (activeSubGroupFilter === "__UNGROUPED__") {
      const ungroupedItems = filteredItems.filter((it) => !it.group || !groupList.includes(it.group));
      orderedBuckets.push({ title: "Chung", items: ungroupedItems });
    } else {
      const bucketItems = filteredItems.filter((it) => it.group === activeSubGroupFilter);
      orderedBuckets.push({ title: activeSubGroupFilter, items: bucketItems });
    }

    contentBodyHtml = `
      <div class="space-y-4">
        ${orderedBuckets
          .map((bucket) => {
            const innerHtml =
              bucket.items.length > 0
                ? `<ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          isEdit,
                          groupList
                        );
                      })
                      .join("")}
                  </ul>`
                : `<p class="text-[11px] text-gray-400 italic px-3 py-2 rounded-xl bg-gray-50/70 border border-dashed border-gray-200">
                    Chưa có ghi chú nào trong nhóm này...
                  </p>`;

            return `
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs font-bold text-pink-600 bg-pink-100/70 px-2.5 py-0.5 rounded-full">
                    ${escapeHtml(bucket.title)} (${bucket.items.length})
                  </span>
                  <div class="h-px flex-1 bg-pink-100"></div>
                </div>
                ${innerHtml}
              </div>
            `;
          })
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
              isEdit,
              groupList
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

      ${subGroupsNavHtml}
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
  activeSubGroupFilter = "ALL";
  topicSearchQuery = "";
  selectedNewItemGroup = "";
  renderTopicsSection();
}

function selectSubGroupFilter(groupFilter) {
  activeSubGroupFilter = groupFilter;
  if (groupFilter !== "ALL" && groupFilter !== "__UNGROUPED__") {
    selectedNewItemGroup = groupFilter;
  } else {
    selectedNewItemGroup = "";
  }
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

async function quickAssignTopicItemGroup(topicId, index, newGroup) {
  const topic = appData.topics.find((t) => t.id === topicId);
  if (!topic || !topic.items[index]) return;

  const current = normalizeTopicItem(topic.items[index]);
  topic.items[index] = newGroup ? { text: current.text, group: newGroup } : current.text;
  await saveAppData();
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
  if (activeSubGroupFilter === groupName) {
    activeSubGroupFilter = "ALL";
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
  if (!picker) return;
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
    activeSubGroupFilter = "ALL";
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
  pushGfActivity("coupon", `Em vừa sử dụng phiếu đổi quà "${cp.title}" ${cp.icon || "🎟️"}`);
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
  if (!picker) return;
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
