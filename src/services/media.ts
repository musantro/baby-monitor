export const audioConfigs = {
  channelCount: 2,
  sampleRate: 44100,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
};

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
