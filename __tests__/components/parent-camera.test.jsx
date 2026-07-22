import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ParentDevice from "../../src/components/ParentDevice";
import {
  getNewPC,
  loadSDP,
  sendMessage,
  storeSDP,
} from "../../src/services/connex";
import { createPlaceholderVideoStream } from "../../src/services/media";

jest.mock("../../src/services/connex", () => ({
  attachDataChannel: jest.fn(),
  getNewPC: jest.fn(),
  loadSDP: jest.fn(),
  sendMessage: jest.fn(),
  storeSDP: jest.fn(),
  waitForIceGatheringCompletion: jest.fn().mockResolvedValue("complete"),
}));

jest.mock("../../src/services/media", () => ({
  createPlaceholderVideoStream: jest.fn(),
}));

jest.mock("../../src/services/settings", () => ({ getBrowserID: () => "parent-id" }));

describe("parent temporary camera", () => {
  let pc;
  let connect;
  let placeholderTrack;
  let cameraTrack;
  let cameraStream;
  let replaceTrack;

  beforeEach(() => {
    jest.clearAllMocks();
    placeholderTrack = { kind: "video", stop: jest.fn() };
    cameraTrack = { kind: "video", stop: jest.fn() };
    cameraStream = {
      getVideoTracks: () => [cameraTrack],
      getTracks: () => [cameraTrack],
    };
    replaceTrack = jest.fn().mockResolvedValue(undefined);
    pc = {
      connectionState: "new",
      setRemoteDescription: jest.fn().mockResolvedValue(undefined),
      createAnswer: jest.fn().mockResolvedValue({ type: "answer" }),
      setLocalDescription: jest.fn().mockResolvedValue(undefined),
      localDescription: { type: "answer" },
      getSenders: () => [{ track: placeholderTrack, replaceTrack }],
      close: jest.fn(),
    };
    createPlaceholderVideoStream.mockReturnValue({
      getVideoTracks: () => [placeholderTrack],
      getTracks: () => [placeholderTrack],
    });
    getNewPC.mockImplementation((options) => {
      connect = options.onConnect;
      return pc;
    });
    loadSDP.mockResolvedValue({ type: "offer", sdp: "offer" });
    storeSDP.mockResolvedValue({ status: "answer-stored" });
    global.navigator.mediaDevices = {
      getUserMedia: jest.fn().mockResolvedValue(cameraStream),
    };
  });

  test("sends only the camera video track and restores the placeholder on stop", async () => {
    const showToast = jest.fn();
    render(<ParentDevice showToast={showToast} />);

    fireEvent.click(screen.getByRole("button", { name: "Request Connection" }));
    await waitFor(() => expect(storeSDP).toHaveBeenCalled());
    act(() => {
      pc.connectionState = "connected";
      connect();
    });

    fireEvent.click(screen.getByRole("button", { name: "Show Parent Camera (Silent)" }));
    await waitFor(() => expect(replaceTrack).toHaveBeenCalledWith(cameraTrack));

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: "user" },
      audio: false,
    });
    expect(sendMessage).toHaveBeenCalledWith("PARENT_CAMERA_START", pc);
    expect(cameraStream.getTracks()).toEqual([cameraTrack]);

    fireEvent.click(screen.getByRole("button", { name: "Stop Parent Camera" }));
    await waitFor(() => expect(replaceTrack).toHaveBeenLastCalledWith(placeholderTrack));
    expect(cameraTrack.stop).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith("PARENT_CAMERA_STOP", pc);
  });

  test("negotiates the placeholder as a video-only stream", async () => {
    render(<ParentDevice showToast={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Request Connection" }));
    await waitFor(() => expect(getNewPC).toHaveBeenCalled());
    const negotiatedStream = getNewPC.mock.calls[0][0].stream;
    expect(negotiatedStream.getTracks()).toEqual([placeholderTrack]);
    expect(negotiatedStream.getTracks().some((track) => track.kind === "audio")).toBe(false);
  });
});
