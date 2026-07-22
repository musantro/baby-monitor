import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import BabyDevice from "../../src/components/BabyDevice";
import {
  attachDataChannel,
  getNewPC,
  loadAndApplyAnswerWhilePolling,
} from "../../src/services/connex";

jest.mock("../../src/services/connex", () => ({
  attachDataChannel: jest.fn(),
  closeAllPCsAndRevokeSDP: jest.fn().mockResolvedValue(undefined),
  createAndStoreOfferWhilePolling: jest.fn().mockResolvedValue(undefined),
  getNewPC: jest.fn(),
  loadAndApplyAnswerWhilePolling: jest.fn(),
  sendMessage: jest.fn(),
}));

jest.mock("../../src/services/settings", () => ({
  getSettings: () => ({
    startWithFrontCamera: true,
    maxParentConnections: 1,
    pollingTimeout: 5,
    restartPolling: false,
    showVideoTimestamp: false,
    trustedParents: ["parent-id"],
  }),
  setSettings: jest.fn(),
}));

describe("baby view for the temporary parent camera", () => {
  let pc;
  let peerCallbacks;
  let receiveSignal;
  let localVideoTrack;
  let localAudioTrack;
  let localStream;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localVideoTrack = { kind: "video", stop: jest.fn() };
    localAudioTrack = { kind: "audio", stop: jest.fn() };
    localStream = {
      getTracks: () => [localVideoTrack, localAudioTrack],
      getVideoTracks: () => [localVideoTrack],
      getAudioTracks: () => [localAudioTrack],
    };
    global.MediaStream = jest.fn((tracks = []) => ({
      tracks,
      addTrack: jest.fn(),
      getTracks: () => tracks,
      getVideoTracks: () => tracks.filter((track) => track.kind === "video"),
      getAudioTracks: () => tracks.filter((track) => track.kind === "audio"),
    }));
    global.navigator.mediaDevices = {
      enumerateDevices: jest.fn().mockResolvedValue([{ kind: "videoinput" }]),
      getUserMedia: jest.fn().mockResolvedValue(localStream),
    };
    pc = {
      parentID: "parent-id",
      connectionState: "connected",
      createDataChannel: jest.fn(() => ({})),
      getSenders: jest.fn(() => []),
      close: jest.fn(),
    };
    getNewPC.mockImplementation((callbacks) => {
      peerCallbacks = callbacks;
      return pc;
    });
    attachDataChannel.mockImplementation((_pc, _channel, onMessage) => {
      receiveSignal = onMessage;
    });
    loadAndApplyAnswerWhilePolling.mockImplementation(async () => {
      peerCallbacks.onConnect(pc);
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  async function startBabyCamera() {
    await waitFor(() => expect(navigator.mediaDevices.enumerateDevices).toHaveBeenCalled());
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start Camera" }));
    });
    await waitFor(() => {
      expect(getNewPC).toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Stop Camera" })).toBeEnabled();
    });
    await act(async () => {
      await Promise.resolve();
    });
  }

  test("moves the baby camera to PiP and restores it when the parent stops", async () => {
    const { container, unmount } = render(<BabyDevice showToast={jest.fn()} />);
    await startBabyCamera();
    const stage = container.querySelector(".baby-video-stage");
    const parentVideo = container.querySelector(".parent-camera-video");
    const babyVideo = container.querySelector(".baby-camera-video");
    const parentTrack = { kind: "video", stop: jest.fn() };

    expect(stage).not.toHaveClass("parent-camera-active");
    expect(babyVideo).toHaveClass("video");

    act(() => peerCallbacks.onTrack({ track: parentTrack }, pc));
    act(() => receiveSignal("PARENT_CAMERA_START", pc));

    expect(stage).toHaveClass("parent-camera-active");
    expect(parentVideo.srcObject.getVideoTracks()).toEqual([parentTrack]);
    expect(babyVideo).toHaveClass("baby-camera-video");

    act(() => receiveSignal("PARENT_CAMERA_STOP", pc));

    expect(stage).not.toHaveClass("parent-camera-active");
    expect(parentVideo.srcObject).toBeNull();
    expect(babyVideo.srcObject.getVideoTracks()).toEqual([localVideoTrack]);
    unmount();
  });

  test("restores the normal view if the active parent disconnects", async () => {
    const { container, unmount } = render(<BabyDevice showToast={jest.fn()} />);
    await startBabyCamera();
    const stage = container.querySelector(".baby-video-stage");
    const parentVideo = container.querySelector(".parent-camera-video");
    const parentTrack = { kind: "video", stop: jest.fn() };

    act(() => peerCallbacks.onTrack({ track: parentTrack }, pc));
    act(() => receiveSignal("PARENT_CAMERA_START", pc));
    expect(stage).toHaveClass("parent-camera-active");

    act(() => receiveSignal("DISCONNECT", pc));

    expect(stage).not.toHaveClass("parent-camera-active");
    expect(parentVideo.srcObject).toBeNull();
    expect(pc.close).toHaveBeenCalled();
    unmount();
  });
});
