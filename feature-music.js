// =========================================================================
// MINI MUSIC PLAYER ĐA BÀI HÁT (HỖ TRỢ YOUTUBE & LINK AUDIO TRỰC TIẾP)
// =========================================================================
let currentTrackIndex = 0;
let isMusicPlaying = false;
let isMusicLooping = true;
let isMusicDrawerOpen = false;
let ytPlayer = null;
let ytApiReady = false;
let pendingAutoPlay = false;
let musicProgressTimer = null;
const htmlAudio = new Audio();

function initMusicPlayer() {
  if (!window.YT) {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else if (window.YT && window.YT.Player) {
    ytApiReady = true;
    createYouTubePlayer();
  }

  htmlAudio.addEventListener("ended", () => {
    handleTrackEnded();
  });

  htmlAudio.addEventListener("error", () => {
    if (isMusicPlaying) {
      showMusicError("Không thể phát link âm thanh này, đang chuyển bài tiếp theo...");
      setTimeout(() => nextTrack(), 1500);
    }
  });

  if (musicProgressTimer) clearInterval(musicProgressTimer);
  musicProgressTimer = setInterval(updateMusicProgressUI, 500);

  syncMusicPlaylistUI();
}

window.onYouTubeIframeAPIReady = function () {
  ytApiReady = true;
  createYouTubePlayer();
};

function createYouTubePlayer() {
  const container = document.getElementById("yt-hidden-player");
  if (!container || ytPlayer) return;

  const playlist = getPlaylist();
  const firstYt = playlist.find((t) => t.type === "youtube" && t.youtubeId);
  const initialVideoId = firstYt ? firstYt.youtubeId : "jfKfPfyJRdk";

  const playerVars = {
    autoplay: 0,
    controls: 0,
    playsinline: 1,
    rel: 0,
    enablejsapi: 1
  };
  if (window.location && window.location.origin && window.location.origin.startsWith("http")) {
    playerVars.origin = window.location.origin;
  }

  ytPlayer = new YT.Player("yt-hidden-player", {
    height: "200",
    width: "200",
    videoId: initialVideoId,
    playerVars,
    events: {
      onReady: () => {
        if (pendingAutoPlay) {
          pendingAutoPlay = false;
          playTrackAt(currentTrackIndex);
        }
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED) {
          handleTrackEnded();
        } else if (event.data === YT.PlayerState.PLAYING) {
          isMusicPlaying = true;
          clearMusicError();
          updatePlayButtonsUI();
        } else if (event.data === YT.PlayerState.BUFFERING) {
          clearMusicError();
        } else if (event.data === YT.PlayerState.PAUSED) {
          isMusicPlaying = false;
          updatePlayButtonsUI();
        }
      },
      onError: (event) => {
        const activeTrack = getPlaylist()[currentTrackIndex];
        if (!activeTrack || activeTrack.type !== "youtube") return;

        // Bỏ qua lỗi cũ từ video mặc định trước khi load bài thật của người dùng
        try {
          const loadedVid = ytPlayer && ytPlayer.getVideoData ? ytPlayer.getVideoData().video_id : "";
          if (loadedVid && loadedVid !== activeTrack.youtubeId) return;
        } catch (e) {}

        const errCode = event ? event.data : 0;
        if (errCode === 101 || errCode === 150) {
          showMusicError("Chủ kênh YouTube này tắt tính năng phát nhúng ngoài. Hãy thử link bản lyric/cover khác nhé!");
          isMusicPlaying = false;
          updatePlayButtonsUI();
          if (getPlaylist().length > 1) {
            setTimeout(() => nextTrack(), 1800);
          }
        } else if (errCode === 100) {
          showMusicError("Video YouTube này không tồn tại hoặc đang ở chế độ riêng tư.");
          isMusicPlaying = false;
          updatePlayButtonsUI();
        } else {
          isMusicPlaying = false;
          updatePlayButtonsUI();
        }
      }
    }
  });
}

function getPlaylist() {
  return Array.isArray(appData.playlist) ? appData.playlist : [];
}

function extractYouTubeId(url) {
  if (!url) return null;
  const clean = String(url).trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const reg of patterns) {
    const match = clean.match(reg);
    if (match && match[1]) return match[1];
  }
  return null;
}

function startMusicOnUnlock() {
  const playlist = getPlaylist();
  if (playlist.length === 0) return;
  currentTrackIndex = 0;
  const track = playlist[0];
  if (track.type === "youtube" && (!ytPlayer || typeof ytPlayer.loadVideoById !== "function")) {
    pendingAutoPlay = true;
    return;
  }
  playTrackAt(0);
}

function playTrackAt(index) {
  const playlist = getPlaylist();
  if (playlist.length === 0) return;

  if (index < 0) index = playlist.length - 1;
  if (index >= playlist.length) index = 0;
  currentTrackIndex = index;

  const track = playlist[currentTrackIndex];
  clearMusicError();

  htmlAudio.pause();
  if (ytPlayer && typeof ytPlayer.pauseVideo === "function") {
    try {
      ytPlayer.pauseVideo();
    } catch (e) {}
  }

  if (track.type === "youtube" && track.youtubeId) {
    if (ytPlayer && typeof ytPlayer.loadVideoById === "function") {
      ytPlayer.loadVideoById(track.youtubeId);
      isMusicPlaying = true;
    } else {
      pendingAutoPlay = true;
    }
  } else if (track.url) {
    htmlAudio.src = track.url;
    htmlAudio
      .play()
      .then(() => {
        isMusicPlaying = true;
        updatePlayButtonsUI();
      })
      .catch(() => {
        isMusicPlaying = false;
        updatePlayButtonsUI();
      });
  }

  syncMusicPlaylistUI();
}

function togglePlayPause() {
  const playlist = getPlaylist();
  if (playlist.length === 0) {
    alert("Danh sách phát hiện chưa có bài hát nào!");
    return;
  }

  if (currentTrackIndex >= playlist.length) {
    currentTrackIndex = 0;
  }

  const track = playlist[currentTrackIndex];
  clearMusicError();

  if (isMusicPlaying) {
    pauseMusic();
  } else {
    if (track.type === "youtube" && track.youtubeId) {
      if (ytPlayer && typeof ytPlayer.playVideo === "function") {
        const currentVid = ytPlayer.getVideoData ? ytPlayer.getVideoData().video_id : "";
        if (currentVid !== track.youtubeId) {
          ytPlayer.loadVideoById(track.youtubeId);
        } else {
          ytPlayer.playVideo();
        }
        isMusicPlaying = true;
      } else {
        pendingAutoPlay = true;
      }
    } else if (track.url) {
      if (htmlAudio.src !== track.url) {
        htmlAudio.src = track.url;
      }
      htmlAudio.play().then(() => {
        isMusicPlaying = true;
        updatePlayButtonsUI();
      });
    }
    updatePlayButtonsUI();
  }
}

function pauseMusic() {
  isMusicPlaying = false;
  htmlAudio.pause();
  if (ytPlayer && typeof ytPlayer.pauseVideo === "function") {
    try {
      ytPlayer.pauseVideo();
    } catch (e) {}
  }
  updatePlayButtonsUI();
}

function nextTrack() {
  const playlist = getPlaylist();
  if (playlist.length === 0) return;
  const nextIdx = (currentTrackIndex + 1) % playlist.length;
  playTrackAt(nextIdx);
}

function prevTrack() {
  const playlist = getPlaylist();
  if (playlist.length === 0) return;
  const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
  playTrackAt(prevIdx);
}

function handleTrackEnded() {
  const playlist = getPlaylist();
  if (playlist.length === 0) return;
  if (currentTrackIndex < playlist.length - 1) {
    playTrackAt(currentTrackIndex + 1);
  } else if (isMusicLooping) {
    playTrackAt(0);
  } else {
    isMusicPlaying = false;
    updatePlayButtonsUI();
  }
}

function toggleLoopMode() {
  isMusicLooping = !isMusicLooping;
  const btn = document.getElementById("music-loop-btn");
  if (btn) {
    btn.className = isMusicLooping
      ? "p-2 rounded-full bg-pink-100 text-pink-600 border border-pink-200 transition"
      : "p-2 rounded-full bg-gray-100 text-gray-400 border border-gray-200 transition";
  }
}

function toggleMusicDrawer() {
  isMusicDrawerOpen = !isMusicDrawerOpen;
  const compact = document.getElementById("music-compact-bar");
  const expanded = document.getElementById("music-expanded-card");
  if (!compact || !expanded) return;

  if (isMusicDrawerOpen) {
    compact.classList.add("hidden");
    expanded.classList.remove("hidden");
  } else {
    expanded.classList.add("hidden");
    compact.classList.remove("hidden");
  }
  lucide.createIcons();
}

function seekMusic(percentVal) {
  const playlist = getPlaylist();
  const track = playlist[currentTrackIndex];
  if (!track) return;
  const pct = Number(percentVal) / 100;

  if (track.type === "youtube" && ytPlayer && typeof ytPlayer.getDuration === "function") {
    const dur = ytPlayer.getDuration() || 0;
    if (dur > 0) ytPlayer.seekTo(dur * pct, true);
  } else if (htmlAudio.duration) {
    htmlAudio.currentTime = htmlAudio.duration * pct;
  }
}

function formatSeconds(sec) {
  if (!sec || isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function updateMusicProgressUI() {
  const playlist = getPlaylist();
  const track = playlist[currentTrackIndex];
  const bar = document.getElementById("music-progress-bar");
  const curEl = document.getElementById("music-time-current");
  const totEl = document.getElementById("music-time-total");
  if (!track || !bar || !curEl || !totEl) return;

  let cur = 0;
  let dur = 0;

  if (track.type === "youtube" && ytPlayer && typeof ytPlayer.getCurrentTime === "function") {
    cur = ytPlayer.getCurrentTime() || 0;
    dur = ytPlayer.getDuration() || 0;
  } else {
    cur = htmlAudio.currentTime || 0;
    dur = htmlAudio.duration || 0;
  }

  curEl.textContent = formatSeconds(cur);
  totEl.textContent = formatSeconds(dur);
  bar.value = dur > 0 ? Math.min(100, Math.round((cur / dur) * 100)) : 0;
}

function updatePlayButtonsUI() {
  const compactBtn = document.getElementById("music-play-btn-compact");
  const fullBtn = document.getElementById("music-play-btn-full");
  const discIcon = document.getElementById("music-disc-icon");

  const iconHtml = isMusicPlaying
    ? `<i data-lucide="pause" class="w-4 h-4 fill-white"></i>`
    : `<i data-lucide="play" class="w-4 h-4 fill-white"></i>`;

  if (compactBtn) compactBtn.innerHTML = iconHtml;
  if (fullBtn) fullBtn.innerHTML = iconHtml;
  if (discIcon) {
    discIcon.className = isMusicPlaying ? "text-xl inline-block animate-spin" : "text-xl inline-block";
  }
  lucide.createIcons();
}

function showMusicError(msg) {
  const errEl = document.getElementById("music-error-banner");
  if (!errEl) return;
  errEl.textContent = msg;
  errEl.classList.remove("hidden");
}

function clearMusicError() {
  const errEl = document.getElementById("music-error-banner");
  if (!errEl) return;
  errEl.classList.add("hidden");
  errEl.textContent = "";
}

function syncMusicPlaylistUI() {
  const playlist = getPlaylist();
  const isEdit = isEditingAllowed();

  if (currentTrackIndex >= playlist.length) {
    currentTrackIndex = Math.max(0, playlist.length - 1);
  }

  const headerTitleText = (appData.profile && appData.profile.musicTitle) || "Góc Nhạc Của Tụi Mình";
  const defaultSubText = (appData.profile && appData.profile.musicSubtitle) || "Nhạc của tụi mình 🎵";

  const headerTitleEl = document.getElementById("music-header-title");
  if (headerTitleEl) headerTitleEl.textContent = headerTitleText;

  const currentTrack = playlist[currentTrackIndex];
  const compactTitle = document.getElementById("music-current-title");
  const compactArtist = document.getElementById("music-current-artist");
  const fullTitle = document.getElementById("music-full-title");
  const fullArtist = document.getElementById("music-full-artist");
  const countEl = document.getElementById("music-playlist-count");
  const listEl = document.getElementById("music-playlist-list");

  if (countEl) countEl.textContent = `${playlist.length} bài hát`;

  if (currentTrack) {
    if (compactTitle) compactTitle.textContent = currentTrack.title;
    if (compactArtist) compactArtist.textContent = currentTrack.artist || defaultSubText;
    if (fullTitle) fullTitle.textContent = currentTrack.title;
    if (fullArtist) fullArtist.textContent = currentTrack.artist || defaultSubText;
  } else {
    if (compactTitle) compactTitle.textContent = "Chưa có bài hát";
    if (compactArtist) compactArtist.textContent = defaultSubText;
    if (fullTitle) fullTitle.textContent = "Danh sách phát trống";
    if (fullArtist) fullArtist.textContent = defaultSubText;
  }

  if (listEl) {
    if (playlist.length === 0) {
      listEl.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">Chưa có bài hát nào trong playlist.</p>`;
    } else {
      listEl.innerHTML = playlist
        .map((t, idx) => {
          const isCurrent = idx === currentTrackIndex;
          const canMoveUp = idx > 0;
          const canMoveDown = idx < playlist.length - 1;
          return `
            <div class="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border transition ${
              isCurrent
                ? "bg-pink-100/80 border-pink-300 text-pink-800"
                : "bg-pink-50/40 border-pink-100 text-gray-700 hover:bg-pink-50"
            }">
              <button onclick="playTrackAt(${idx})" class="flex items-center gap-2 min-w-0 flex-1 text-left">
                <span class="text-xs font-bold text-pink-500 shrink-0">${isCurrent && isMusicPlaying ? "🔊" : idx + 1 + "."}</span>
                <div class="min-w-0">
                  <div class="text-xs font-bold truncate">${escapeHtml(t.title)}</div>
                  ${t.artist ? `<div class="text-[10px] text-gray-400 truncate">${escapeHtml(t.artist)}</div>` : ""}
                </div>
              </button>
              ${
                isEdit
                  ? `<div class="flex items-center gap-0.5 shrink-0">
                      <button onclick="moveMusicTrack(${idx}, -1)" ${!canMoveUp ? "disabled" : ""} class="p-1 rounded text-pink-500 hover:bg-pink-200/60 disabled:opacity-30" title="Lên">
                        <i data-lucide="arrow-up" class="w-3 h-3"></i>
                      </button>
                      <button onclick="moveMusicTrack(${idx}, 1)" ${!canMoveDown ? "disabled" : ""} class="p-1 rounded text-pink-500 hover:bg-pink-200/60 disabled:opacity-30" title="Xuống">
                        <i data-lucide="arrow-down" class="w-3 h-3"></i>
                      </button>
                      <button onclick="openAddMusicModal('${t.id}')" class="p-1 rounded text-pink-500 hover:bg-pink-200/60" title="Sửa">
                        <i data-lucide="pencil" class="w-3 h-3"></i>
                      </button>
                      <button onclick="deleteMusicTrack('${t.id}')" class="p-1 rounded text-rose-400 hover:bg-rose-100" title="Xóa">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                      </button>
                    </div>`
                  : ""
              }
            </div>
          `;
        })
        .join("");
    }
  }

  updatePlayButtonsUI();
}

// =========================================================================
// CHỈNH SỬA TIÊU ĐỀ & DÒNG MÔ TẢ GÓC NHẠC
// =========================================================================
function openMusicSettingsModal() {
  const titleInput = document.getElementById("input-music-corner-title");
  const subInput = document.getElementById("input-music-corner-subtitle");
  if (titleInput) {
    titleInput.value = (appData.profile && appData.profile.musicTitle) || "Góc Nhạc Của Tụi Mình";
  }
  if (subInput) {
    subInput.value = (appData.profile && appData.profile.musicSubtitle) || "Nhạc của tụi mình 🎵";
  }
  const modal = document.getElementById("modal-music-settings");
  if (modal) modal.classList.remove("hidden");
  lucide.createIcons();
}

function closeMusicSettingsModal() {
  const modal = document.getElementById("modal-music-settings");
  if (modal) modal.classList.add("hidden");
}

async function saveMusicSettings() {
  const titleInput = document.getElementById("input-music-corner-title");
  const subInput = document.getElementById("input-music-corner-subtitle");
  if (titleInput) {
    appData.profile.musicTitle = titleInput.value.trim() || "Góc Nhạc Của Tụi Mình";
  }
  if (subInput) {
    appData.profile.musicSubtitle = subInput.value.trim() || "Nhạc của tụi mình 🎵";
  }
  closeMusicSettingsModal();
  await saveAppData();
}

// =========================================================================
// QUẢN LÝ PLAYLIST (THÊM / SỬA / XÓA / ĐỔI THỨ TỰ BÀI HÁT)
// =========================================================================
function openAddMusicModal(trackId = null) {
  document.getElementById("edit-music-id").value = trackId || "";

  if (trackId) {
    const track = getPlaylist().find((t) => t.id === trackId);
    if (!track) return;
    document.getElementById("music-modal-title").innerHTML = `<i data-lucide="pencil" class="w-5 h-5"></i> Chỉnh Sửa Bài Hát`;
    document.getElementById("input-music-url").value = track.url || "";
    document.getElementById("input-music-title").value = track.title || "";
    document.getElementById("input-music-artist").value = track.artist || "";
  } else {
    document.getElementById("music-modal-title").innerHTML = `<i data-lucide="music" class="w-5 h-5"></i> Thêm Bài Hát Vào Playlist`;
    document.getElementById("input-music-url").value = "";
    document.getElementById("input-music-title").value = "";
    document.getElementById("input-music-artist").value = "";
  }

  document.getElementById("modal-music").classList.remove("hidden");
  lucide.createIcons();
}

function closeAddMusicModal() {
  document.getElementById("modal-music").classList.add("hidden");
}

async function fetchYouTubeTitle(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.title || null;
  } catch (e) {
    return null;
  }
}

async function saveMusicTrack() {
  const rawUrl = document.getElementById("input-music-url").value.trim();
  let title = document.getElementById("input-music-title").value.trim();
  const artist = document.getElementById("input-music-artist").value.trim();
  const editId = document.getElementById("edit-music-id").value;
  const saveBtn = document.getElementById("btn-save-music");

  if (!rawUrl) {
    alert("Anh nhớ dán link YouTube hoặc link nhạc vào nhé!");
    return;
  }

  const ytId = extractYouTubeId(rawUrl);
  const trackType = ytId ? "youtube" : "audio";

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Đang xử lý...";
  }

  if (!title && ytId) {
    const fetchedTitle = await fetchYouTubeTitle(ytId);
    title = fetchedTitle || `Bài hát YouTube (${ytId})`;
  } else if (!title) {
    title = `Giai điệu yêu thương #${getPlaylist().length + 1}`;
  }

  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.textContent = "Lưu Bài Hát";
  }

  appData.playlist = getPlaylist();

  if (editId) {
    const track = appData.playlist.find((t) => t.id === editId);
    if (track) {
      track.url = rawUrl;
      track.title = title;
      track.artist = artist;
      track.type = trackType;
      track.youtubeId = ytId || "";
    }
  } else {
    appData.playlist.push({
      id: "song_" + Date.now(),
      title,
      artist,
      type: trackType,
      youtubeId: ytId || "",
      url: rawUrl
    });
  }

  closeAddMusicModal();
  await saveAppData();
}

async function deleteMusicTrack(trackId) {
  if (!confirm("Anh muốn xóa bài hát này khỏi danh sách phát?")) return;
  const idx = getPlaylist().findIndex((t) => t.id === trackId);
  if (idx === -1) return;

  const wasCurrent = idx === currentTrackIndex;
  appData.playlist.splice(idx, 1);

  if (wasCurrent) {
    pauseMusic();
    currentTrackIndex = 0;
  } else if (idx < currentTrackIndex) {
    currentTrackIndex = Math.max(0, currentTrackIndex - 1);
  }

  await saveAppData();
}

async function moveMusicTrack(index, direction) {
  const list = getPlaylist();
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= list.length) return;

  const temp = list[index];
  list[index] = list[targetIndex];
  list[targetIndex] = temp;

  if (currentTrackIndex === index) currentTrackIndex = targetIndex;
  else if (currentTrackIndex === targetIndex) currentTrackIndex = index;

  await saveAppData();
}
