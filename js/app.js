const tracks = window.musicTracks;

const requestedTrack = Number(new URLSearchParams(window.location.search).get("track"));
const initialTrackNumber =
  Number.isInteger(requestedTrack) && requestedTrack >= 1 && requestedTrack <= tracks.length
    ? requestedTrack
    : 1;
const audio = document.querySelector("#audio-player");
const playButton = document.querySelector("#play-toggle");
const vinyl = document.querySelector(".vinyl");
const progress = document.querySelector("#audio-progress");
const currentTimeDisplay = document.querySelector("#current-time");
const durationDisplay = document.querySelector("#duration");
const status = document.querySelector("#audio-status");
const trackTitle = document.querySelector("#track-title");
const trackArtist = document.querySelector("#track-artist");
const artistName = document.querySelector("#artist-name");
const coverArt = document.querySelector("#cover-art");
const trackSelector = document.querySelector("#track-selector");
const waveform = document.querySelector("#waveform");
const recordStage = document.querySelector(".record-stage");
const lyricsList = document.querySelector("#lyrics-list");
let currentTrack = null;
let lyricElements = [];
let activeLyricIndex = -1;
let trackSelectionVersion = 0;
let audioContext = null;
let audioAnalyser = null;
let audioSource = null;
let frequencyData = null;
let visualizerFrame = 0;
let barLevels = [];
let bassPulseLevel = 0;
let lastVisualizerFrameTime = 0;

function renderWaveform() {
  const bars = Array.from({ length: 48 }, (_, index) => {
    const variation = (Math.sin(index * 2.17) + 1) / 2;
    const bar = document.createElement("span");
    bar.className = "waveform-bar";
    bar.setAttribute("aria-hidden", "true");
    bar.style.setProperty("--wave-peak", `${0.3 + variation * 0.7}`);
    bar.style.setProperty("--wave-delay", `${-((index * 113) % 1200)}ms`);
    return bar;
  });
  waveform.replaceChildren(...bars);
  barLevels = bars.map(() => 0.17);
}

function initializeAudioAnalyser() {
  const audioUrl = new URL(audio.currentSrc || audio.src, document.baseURI);
  if (audioUrl.origin !== window.location.origin) return;

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    status.textContent = "Trình duyệt này chưa hỗ trợ phân tích sóng âm thời gian thực.";
    return;
  }

  try {
    if (!audioContext) {
      audioContext = new AudioContextConstructor();
      audioSource = audioContext.createMediaElementSource(audio);
      audioAnalyser = audioContext.createAnalyser();
      audioAnalyser.fftSize = 128;
      audioAnalyser.smoothingTimeConstant = 0.78;
      audioSource.connect(audioAnalyser);
      audioAnalyser.connect(audioContext.destination);
      frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch((error) => {
        status.textContent = "Không thể khởi động bộ phân tích âm thanh.";
        console.error("AudioContext resume failed:", error);
      });
    }
  } catch (error) {
    status.textContent = "Không thể khởi động bộ phân tích âm thanh.";
    console.error("Audio visualizer initialization failed:", error);
    audioAnalyser = null;
  }
}

function renderAudioFrame(timestamp) {
  if (!audioAnalyser || !frequencyData || audio.paused || audio.ended) {
    visualizerFrame = 0;
    resetBassPulse();
    return;
  }

  audioAnalyser.getByteFrequencyData(frequencyData);
  const bars = waveform.children;
  const bassBinCount = Math.max(1, Math.floor(frequencyData.length * 0.12));
  const bassLevel =
    frequencyData
      .slice(0, bassBinCount)
      .reduce((sum, value) => sum + value, 0) /
    (bassBinCount * 255);
  const frameDelta = lastVisualizerFrameTime
    ? Math.min((timestamp - lastVisualizerFrameTime) / 1000, 0.05)
    : 1 / 60;
  lastVisualizerFrameTime = timestamp;
  const bassPulseTarget = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : Math.min(1, Math.max(0, (bassLevel - 0.08) / 0.42));
  const pulseSmoothing = 1 - Math.exp(-frameDelta / (bassPulseTarget > bassPulseLevel ? 0.065 : 0.24));
  bassPulseLevel += (bassPulseTarget - bassPulseLevel) * pulseSmoothing;
  recordStage.style.setProperty("--beat-scale", String(1 + bassPulseLevel * 0.035));

  for (let index = 0; index < bars.length; index += 1) {
    const center = (bars.length - 1) / 2;
    const centerDistance = Math.abs(index - center) / center;
    const frequencyRatio = centerDistance * centerDistance;
    const binIndex = Math.min(
      frequencyData.length - 1,
      Math.floor(frequencyRatio * frequencyData.length),
    );
    const frequencyLevel = frequencyData[binIndex] / 255;
    const centerPeak = bassLevel * 0.62 * Math.exp(-centerDistance * 7);
    const frequencyContribution = frequencyLevel * (0.58 - centerDistance * 0.12);
    const edgeFalloff = 1 - centerDistance * 0.48;
    const targetLevel = Math.min(
      1,
      Math.max(0.12, (frequencyContribution + centerPeak) * edgeFalloff),
    );
    barLevels[index] +=
      (targetLevel - barLevels[index]) * (targetLevel > barLevels[index] ? 0.42 : 0.12);
    bars[index].style.transform = `scaleY(${barLevels[index]})`;
  }

  visualizerFrame = window.requestAnimationFrame(renderAudioFrame);
}

function startAudioVisualizer() {
  if (!audioAnalyser || visualizerFrame) return;
  lastVisualizerFrameTime = 0;
  recordStage.classList.add("is-beating");
  waveform.classList.add("is-live");
  visualizerFrame = window.requestAnimationFrame(renderAudioFrame);
}

function resetBassPulse() {
  bassPulseLevel = 0;
  lastVisualizerFrameTime = 0;
  recordStage.classList.remove("is-beating");
  recordStage.style.setProperty("--beat-scale", "1");
}

function stopAudioVisualizer() {
  if (visualizerFrame) {
    window.cancelAnimationFrame(visualizerFrame);
    visualizerFrame = 0;
  }
  waveform.classList.remove("is-live");
  resetBassPulse();

  const settleBars = () => {
    if (!audio.paused && !audio.ended) {
      visualizerFrame = 0;
      startAudioVisualizer();
      return;
    }

    let settled = true;
    for (let index = 0; index < waveform.children.length; index += 1) {
      barLevels[index] += (0.12 - barLevels[index]) * 0.16;
      if (Math.abs(barLevels[index] - 0.12) > 0.008) settled = false;
      waveform.children[index].style.transform = `scaleY(${barLevels[index]})`;
    }

    if (settled) {
      visualizerFrame = 0;
      return;
    }
    visualizerFrame = window.requestAnimationFrame(settleBars);
  };

  visualizerFrame = window.requestAnimationFrame(settleBars);
}

function playAudio() {
  initializeAudioAnalyser();
  return audio.play();
}

function getPlaybackErrorMessage(error) {
  if (audio.error) {
    switch (audio.error.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return "Tải bài hát đã bị hủy. Hãy thử bấm Play lại.";
      case MediaError.MEDIA_ERR_NETWORK:
        return "Lỗi mạng khi tải bài hát. Hãy kiểm tra kết nối và đường dẫn audioSrc.";
      case MediaError.MEDIA_ERR_DECODE:
        return "Tệp âm thanh không đọc được hoặc bị hỏng. Hãy kiểm tra lại tệp MP3.";
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return "Không hỗ trợ nguồn âm thanh này. Hãy kiểm tra URL và định dạng trong audioSrc.";
      default:
        return "Không thể tải bài hát. Hãy kiểm tra URL audioSrc và thử lại.";
    }
  }

  if (error?.name === "NotAllowedError") {
    return "Trình duyệt từ chối phát nhạc. Hãy bấm Play để thử lại.";
  }
  if (error?.name === "NotSupportedError") {
    return "Không hỗ trợ nguồn âm thanh này. Hãy kiểm tra URL và định dạng trong audioSrc.";
  }
  if (error?.name === "NetworkError") {
    return "Lỗi mạng khi tải bài hát. Hãy kiểm tra kết nối và đường dẫn audioSrc.";
  }
  return "Không thể phát bài hát. Hãy kiểm tra kết nối và URL audioSrc.";
}

function reportPlaybackError(context, error) {
  const audioError = audio.error;
  const errorDetails =
    error && typeof error === "object"
      ? {
          name: error.name,
          type: error.type,
          code: error.code,
          message: error.message,
        }
      : error === undefined
        ? undefined
        : { message: String(error) };
  status.textContent = getPlaybackErrorMessage(error);
  console.error(context, {
    track: currentTrack?.title,
    src: audio.currentSrc || audio.src,
    error: errorDetails,
    mediaErrorCode: audioError?.code,
    mediaErrorMessage: audioError?.message,
    networkState: audio.networkState,
    readyState: audio.readyState,
  });
}

function renderLyrics() {
  lyricsList.replaceChildren();
  lyricElements = currentTrack.lyrics.map(({ text }, index) => {
    const line = document.createElement("li");
    line.className = "lyrics-line";
    line.textContent = text;
    line.dataset.index = String(index);
    lyricsList.append(line);
    return line;
  });
  activeLyricIndex = -1;
}

function renderTrackSelector() {
  trackSelector.replaceChildren();
  tracks.forEach((track, index) => {
    const trackNumber = index + 1;
    const button = document.createElement("button");
    button.className = "track-option";
    button.type = "button";
    button.dataset.track = String(trackNumber);
    button.setAttribute("aria-label", `Phát bài ${trackNumber}: ${track.title}`);
    button.setAttribute("aria-pressed", "false");

    const number = document.createElement("span");
    number.className = "track-option-number";
    number.textContent = String(trackNumber).padStart(2, "0");

    const title = document.createElement("span");
    title.className = "track-option-title";
    title.textContent = track.title;

    button.append(number, title);
    button.addEventListener("click", () => {
      void selectTrack(trackNumber, { updateUrl: true, resumePlayback: !audio.paused });
    });
    trackSelector.append(button);
  });
}

async function selectTrack(trackNumber, { updateUrl, resumePlayback }) {
  const nextTrack = tracks[trackNumber - 1];
  if (!nextTrack || nextTrack === currentTrack) return;

  const selectionVersion = ++trackSelectionVersion;
  audio.pause();
  currentTrack = nextTrack;
  trackTitle.textContent = currentTrack.title;
  trackArtist.textContent = currentTrack.artist;
  artistName.textContent = currentTrack.artist;
  document.title = `${currentTrack.title} — ${currentTrack.artist} | Blue Hour`;
  coverArt.src = currentTrack.coverImage;
  coverArt.alt = `Bìa đĩa ${currentTrack.title}`;
  recordStage.setAttribute("aria-label", `Đĩa vinyl: ${currentTrack.title}`);
  trackSelector.querySelectorAll(".track-option").forEach((button) => {
    const isActive = Number(button.dataset.track) === trackNumber;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderLyrics();
  status.textContent = "";
  currentTimeDisplay.textContent = "0:00";
  durationDisplay.textContent = "--:--";
  progress.value = "0";
  progress.max = "0";
  progress.disabled = true;
  progress.style.setProperty("--progress", "0%");

  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("track", String(trackNumber));
    window.history.replaceState(null, "", url);
  }

  audio.src = currentTrack.audioSrc;
  audio.load();
  updateLyrics(0);

  if (resumePlayback) {
    try {
      await playAudio();
    } catch (error) {
      if (selectionVersion === trackSelectionVersion && error?.name !== "AbortError") {
        reportPlaybackError("Audio playback failed after changing track:", error);
      }
    }
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function updateLyrics(currentTime) {
  let nextIndex = -1;
  for (let index = 0; index < currentTrack.lyrics.length; index += 1) {
    if (currentTrack.lyrics[index].time > currentTime) break;
    nextIndex = index;
  }

  if (nextIndex === activeLyricIndex) return;
  if (activeLyricIndex >= 0) {
    lyricElements[activeLyricIndex].classList.remove("is-active");
    lyricElements[activeLyricIndex].removeAttribute("aria-current");
  }
  activeLyricIndex = nextIndex;
  if (activeLyricIndex < 0) return;

  const activeLine = lyricElements[activeLyricIndex];
  activeLine.classList.add("is-active");
  activeLine.setAttribute("aria-current", "true");
  const listRect = lyricsList.getBoundingClientRect();
  const lineRect = activeLine.getBoundingClientRect();
  const scrollTop =
    lyricsList.scrollTop +
    lineRect.top -
    listRect.top -
    lyricsList.clientHeight / 2 +
    lineRect.height / 2;
  lyricsList.scrollTo({
    top: scrollTop,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
  });
}

function updatePlaybackState() {
  const isPlaying = !audio.paused && !audio.ended;
  playButton.classList.toggle("is-playing", isPlaying);
  playButton.setAttribute("aria-label", isPlaying ? "Tạm dừng nhạc" : "Phát nhạc");
  playButton.setAttribute("aria-pressed", String(isPlaying));
  vinyl.classList.toggle("is-playing", isPlaying);
  waveform.classList.toggle("is-playing", isPlaying);
  waveform.setAttribute(
    "aria-label",
    `Sóng âm thanh, ${isPlaying ? "đang phát" : "đang tạm dừng"}`,
  );
}

function updateProgress() {
  if (Number.isFinite(audio.duration)) {
    progress.max = String(audio.duration);
    progress.value = String(audio.currentTime);
    progress.style.setProperty("--progress", `${(audio.currentTime / audio.duration) * 100}%`);
    progress.setAttribute("aria-valuetext", formatTime(audio.currentTime));
    currentTimeDisplay.textContent = formatTime(audio.currentTime);
  }
  updateLyrics(audio.currentTime);
}

playButton.addEventListener("click", async () => {
  if (audio.paused) {
    status.textContent = "";
    try {
      await playAudio();
    } catch (error) {
      reportPlaybackError("Audio playback failed:", error);
    }
  } else {
    audio.pause();
  }
});

document.querySelector("#seek-back").addEventListener("click", () => {
  if (Number.isFinite(audio.duration)) {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  }
});

document.querySelector("#seek-forward").addEventListener("click", () => {
  if (Number.isFinite(audio.duration)) {
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
  }
});

progress.addEventListener("input", () => {
  audio.currentTime = Number(progress.value);
  updateProgress();
});

audio.addEventListener("loadedmetadata", () => {
  durationDisplay.textContent = formatTime(audio.duration);
  progress.disabled = false;
  updateProgress();
});
audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("seeked", updateProgress);
audio.addEventListener("play", updatePlaybackState);
audio.addEventListener("pause", updatePlaybackState);
audio.addEventListener("ended", updatePlaybackState);
audio.addEventListener("error", () => {
  reportPlaybackError("Audio resource failed to load:", audio.error);
});
audio.addEventListener("playing", () => {
  status.textContent = "";
  updatePlaybackState();
  startAudioVisualizer();
});
audio.addEventListener("pause", stopAudioVisualizer);
audio.addEventListener("ended", stopAudioVisualizer);
renderWaveform();
renderTrackSelector();
void selectTrack(initialTrackNumber, { updateUrl: false, resumePlayback: false });
