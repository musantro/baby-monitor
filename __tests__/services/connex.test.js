import {
  attachDataChannel,
  closeAllPCsAndRevokeSDP,
  createAndStoreOfferWhilePolling,
  getNewPC,
  loadAndApplyAnswerWhilePolling,
  loadSDP,
  sendMessage,
  storeSDP,
  waitForIceGatheringCompletion,
} from "../../src/services/connex";

beforeEach(() => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ json: jest.fn().mockResolvedValue({ status: "ok" }) });
});

describe("signalling service", () => {
  test("stores and loads SDP through the signalling endpoint", async () => {
    await expect(storeSDP({ type: "offer" })).resolves.toEqual({ status: "ok" });
    await expect(loadSDP("answer")).resolves.toEqual({ status: "ok" });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/v1/exchange",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/exchange?type=answer",
      expect.objectContaining({ method: "GET" }),
    );
  });

  test("configures peer connection callbacks and stream tracks", () => {
    const pc = { addTrack: jest.fn() };
    global.RTCPeerConnection = jest.fn(() => pc);
    const track = {};
    const onConnect = jest.fn();
    const onDisconnect = jest.fn();
    const onTrack = jest.fn();
    getNewPC({ onConnect, onDisconnect, onTrack, stream: { getTracks: () => [track] } });
    pc.connectionState = "connected";
    pc.onconnectionstatechange();
    pc.connectionState = "failed";
    pc.onconnectionstatechange();
    pc.ontrack("event");
    expect(pc.addTrack).toHaveBeenCalledWith(track, expect.any(Object));
    expect(onConnect).toHaveBeenCalledWith(pc);
    expect(onDisconnect).toHaveBeenCalledWith(pc);
    expect(onTrack).toHaveBeenCalledWith("event", pc);
  });

  test("attaches outgoing and incoming data channels", () => {
    const onMessage = jest.fn();
    const outgoing = {};
    const pc = {};
    attachDataChannel(pc, outgoing, onMessage);
    outgoing.onopen();
    outgoing.onmessage({ data: "MUTE" });
    expect(onMessage).toHaveBeenCalledWith("MUTE", pc);
    const incomingPc = {};
    attachDataChannel(incomingPc, null, onMessage);
    const incoming = {};
    incomingPc.ondatachannel({ channel: incoming });
    incoming.onopen();
    incoming.onmessage({ data: "UNMUTE" });
    expect(onMessage).toHaveBeenCalledWith("UNMUTE", incomingPc);
  });

  test("waits for ICE completion, closes peers and sends open messages", async () => {
    const listeners = {};
    const pc = {
      iceGatheringState: "gathering",
      addEventListener: jest.fn((name, handler) => {
        listeners[name] = handler;
      }),
      removeEventListener: jest.fn(),
    };
    const waiting = waitForIceGatheringCompletion(pc);
    pc.iceGatheringState = "complete";
    listeners.icegatheringstatechange();
    await expect(waiting).resolves.toBe("complete");
    const send = jest.fn();
    sendMessage("PING", { dataChannel: { readyState: "open", send } });
    expect(send).toHaveBeenCalledWith("PING");
    const close = jest.fn();
    await closeAllPCsAndRevokeSDP([{ close }, null]);
    expect(close).toHaveBeenCalled();
  });

  test("creates an offer, stores it while polling and applies trusted answers", async () => {
    const pc = {
      createOffer: jest.fn().mockResolvedValue({ type: "offer" }),
      setLocalDescription: jest.fn(),
      iceGatheringState: "complete",
      removeEventListener: jest.fn(),
      addEventListener: jest.fn(),
      localDescription: { type: "offer" },
      close: jest.fn(),
      setRemoteDescription: jest.fn(),
    };
    let polling = true;
    global.fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ status: "offer-stored" }),
    });
    await createAndStoreOfferWhilePolling(pc, () => polling);
    expect(fetch).toHaveBeenCalled();
    polling = false;
    global.fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ type: "answer", parentID: "parent", sdp: "answer" }),
    });
    jest.useFakeTimers();
    const answer = loadAndApplyAnswerWhilePolling(
      pc,
      () => true,
      jest.fn(() => true),
    );
    await jest.advanceTimersByTimeAsync(5000);
    await answer;
    jest.useRealTimers();
    expect(pc.setRemoteDescription).toHaveBeenCalledWith("answer");
  });
});
