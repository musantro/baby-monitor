import { getAudioAmplifiedMediaStream } from "../../src/services/media";

test("creates a stream with original video and amplified audio", async () => {
  const videoTrack = { kind: "video" };
  const audioTrack = { kind: "audio" };
  const source = { connect: jest.fn() };
  const gainNode = { gain: {}, connect: jest.fn() };
  const destination = { stream: { getAudioTracks: () => [audioTrack] } };
  global.navigator.mediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue({ getVideoTracks: () => [videoTrack] }),
  };
  global.AudioContext = jest.fn(() => ({
    createMediaStreamSource: () => source,
    createGain: () => gainNode,
    createMediaStreamDestination: () => destination,
  }));
  global.MediaStream = jest.fn(() => ({ addTrack: jest.fn() }));
  const stream = await getAudioAmplifiedMediaStream({ audio: true }, 4);
  expect(gainNode.gain.value).toBe(4);
  expect(source.connect).toHaveBeenCalledWith(gainNode);
  expect(stream.addTrack).toHaveBeenCalledWith(videoTrack);
  expect(stream.addTrack).toHaveBeenCalledWith(audioTrack);
});

test("validates configs and defaults invalid gain values", async () => {
  await expect(getAudioAmplifiedMediaStream()).rejects.toThrow("mediaConfigs is required");
  const stream = { getVideoTracks: () => [], getAudioTracks: () => [] };
  global.navigator.mediaDevices = { getUserMedia: jest.fn().mockResolvedValue(stream) };
  global.AudioContext = jest.fn(() => ({
    createMediaStreamSource: () => ({ connect: jest.fn() }),
    createGain: () => ({ gain: {}, connect: jest.fn() }),
    createMediaStreamDestination: () => ({ stream }),
  }));
  global.MediaStream = jest.fn(() => ({ addTrack: jest.fn() }));
  await getAudioAmplifiedMediaStream({ audio: true }, 0);
  expect(global.AudioContext).toHaveBeenCalled();
});
