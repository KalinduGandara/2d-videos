import { SimManager } from "./core/SimManager.js";
import { getVideoById, videoRegistry } from "./videos/registry.js";

let sim: SimManager;
let startOverlay: HTMLElement | null;
let startButton: HTMLButtonElement | null;
let overlayText: HTMLElement | null;
let videoSelect: HTMLSelectElement | null;
let selectedVideoId = "";

function hideOverlay(): void {
  if (!startOverlay) {
    return;
  }
  startOverlay.style.opacity = "0";
  setTimeout(() => {
    if (startOverlay) {
      startOverlay.style.display = "none";
    }
  }, 320);
}

function populateVideoSelect(): void {
  if (!videoSelect) {
    return;
  }
  videoSelect.innerHTML = "";
  for (const video of videoRegistry) {
    const option = document.createElement("option");
    option.value = video.id;
    option.textContent = `${video.id} — ${video.title}`;
    videoSelect.appendChild(option);
  }
  if (!selectedVideoId) {
    selectedVideoId = videoRegistry[0]?.id || "";
  }
  videoSelect.value = selectedVideoId;
}

function buildSelectedVideo(simManager: SimManager) {
  const video = getVideoById(selectedVideoId);
  const scene = video.createScene();
  scene.setup(simManager);
  return video;
}

async function startSimulation(): Promise<void> {
  if (!sim || sim.started) {
    return;
  }

  if (startButton) {
    startButton.disabled = true;
    startButton.textContent = "★ Starting...";
  }
  if (overlayText) {
    overlayText.textContent = "Resuming audio context...";
  }

  await sim.resumeAudio();
  const video = buildSelectedVideo(sim);
  sim.setStarted(true);

  if (overlayText) {
    overlayText.textContent = `${video.title} started`;
  }
  hideOverlay();
}

window.setup = function setup(): void {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  rectMode(CORNER);
  noStroke();

  sim = new SimManager();
  sim.drawTrailFade();

  startOverlay = document.getElementById("overlay");
  startButton = document.getElementById("startBtn") as HTMLButtonElement | null;
  overlayText = document.getElementById("overlayText");
  videoSelect = document.getElementById("videoSelect") as HTMLSelectElement | null;

  populateVideoSelect();

  if (videoSelect) {
    videoSelect.addEventListener("change", () => {
      selectedVideoId = videoSelect ? videoSelect.value : selectedVideoId;
    });
  }

  if (startButton) {
    startButton.addEventListener("click", () => {
      void startSimulation();
    });
  }
};

window.draw = function draw(): void {
  sim.tick();
};

window.windowResized = function windowResized(): void {
  resizeCanvas(windowWidth, windowHeight);
};
