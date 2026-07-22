export const audioConfigs = {
  channelCount: 2,
  sampleRate: 44100,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
};

function formatTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Draws a timestamp directly into the outgoing video frames so every receiver
 * sees the same overlay, independently of its own display size.
 */
export async function createTimestampedMediaStream(sourceStream: MediaStream) {
  const sourceVideo = document.createElement("video");
  sourceVideo.muted = true;
  sourceVideo.playsInline = true;
  sourceVideo.srcObject = new MediaStream(sourceStream.getVideoTracks());

  await new Promise<void>((resolve) => {
    sourceVideo.onloadedmetadata = () => resolve();
  });
  await sourceVideo.play();

  const canvas = document.createElement("canvas");
  canvas.width = sourceVideo.videoWidth;
  canvas.height = sourceVideo.videoHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create video canvas context");
  let animationFrame: number;

  function drawFrame() {
    context.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
    const fontSize = Math.max(16, Math.round(Math.min(canvas.width, canvas.height) * 0.055));
    const padding = Math.round(fontSize * 0.45);
    const timestamp = formatTimestamp(new Date());
    context.font = `600 ${fontSize}px sans-serif`;
    context.textBaseline = "bottom";
    const textWidth = context.measureText(timestamp).width;
    const x = canvas.width - padding;
    const y = canvas.height - padding;
    context.fillStyle = "rgba(0, 0, 0, 0.58)";
    context.fillRect(
      x - textWidth - padding,
      y - fontSize - padding,
      textWidth + padding * 2,
      fontSize + padding * 1.5,
    );
    context.fillStyle = "white";
    context.textAlign = "right";
    context.fillText(timestamp, x, y);
    animationFrame = requestAnimationFrame(drawFrame);
  }
  drawFrame();

  const timestampedStream = canvas.captureStream(30);
  sourceStream.getAudioTracks().forEach((track) => timestampedStream.addTrack(track));

  return {
    stream: timestampedStream,
    stop: () => {
      cancelAnimationFrame(animationFrame);
      sourceVideo.pause();
      sourceVideo.srcObject = null;
      timestampedStream.getVideoTracks().forEach((track) => track.stop());
    },
  };
}

export async function getAudioAmplifiedMediaStream(mediaConfigs, gainValue = 10) {
  if (!mediaConfigs) throw new Error("error: mediaConfigs is required");
  if (!gainValue || gainValue < 1) gainValue = 1.0; // default no change

  const mediaStream = await navigator.mediaDevices.getUserMedia(mediaConfigs);
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(mediaStream);

  const gainNode = audioContext.createGain();
  gainNode.gain.value = gainValue;

  source.connect(gainNode);
  const destination = audioContext.createMediaStreamDestination();
  gainNode.connect(destination);

  const audioAmplifiedMediaStream = new MediaStream();
  mediaStream.getVideoTracks().forEach((track) => audioAmplifiedMediaStream.addTrack(track));
  destination.stream.getAudioTracks().forEach((track) => audioAmplifiedMediaStream.addTrack(track));

  return audioAmplifiedMediaStream;
}
