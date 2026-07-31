import { createTimestampedMediaStream, getAudioAmplifiedMediaStream } from "../../src/services/media";

test("draws the monitor battery percentage on the left of timestamped video", async () => {
  const videoTrack = { kind: "video", stop: jest.fn() };
  const audioTrack = { kind: "audio" };
  const outputTrack = { kind: "video", stop: jest.fn() };
  const sourceStream = {
    getVideoTracks: () => [videoTrack],
    getAudioTracks: () => [audioTrack],
  };
  const context = {
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn((text) => ({ width: text.length * 10 })),
    strokeRect: jest.fn(),
  };
  const outputStream = {
    addTrack: jest.fn(),
    getVideoTracks: () => [outputTrack],
  };
  const sourceVideo = {
    muted: false,
    playsInline: false,
    videoWidth: 1280,
    videoHeight: 720,
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    set onloadedmetadata(callback) {
      callback();
    },
  };
  const canvas = {
    getContext: () => context,
    captureStream: jest.fn(() => outputStream),
  };
  const battery = {
    level: 0.73,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const createElement = jest.spyOn(document, "createElement").mockImplementation((tagName) => (
    tagName === "video" ? sourceVideo : canvas
  ));
  global.MediaStream = jest.fn(() => ({ getVideoTracks: () => [videoTrack] }));
  global.navigator.getBattery = jest.fn().mockResolvedValue(battery);
  global.requestAnimationFrame = jest.fn(() => 42);
  global.cancelAnimationFrame = jest.fn();

  const renderer = await createTimestampedMediaStream(sourceStream);

  expect(context.fillText).toHaveBeenCalledWith("73%", expect.any(Number), expect.any(Number));
  expect(context.strokeRect).toHaveBeenCalled();
  expect(battery.addEventListener).toHaveBeenCalledWith("levelchange", expect.any(Function));
  expect(outputStream.addTrack).toHaveBeenCalledWith(audioTrack);

  renderer.stop();
  expect(battery.removeEventListener).toHaveBeenCalledWith("levelchange", expect.any(Function));
  expect(outputTrack.stop).toHaveBeenCalled();
  createElement.mockRestore();
  delete global.navigator.getBattery;
});

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
