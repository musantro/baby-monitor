const baseURL = globalThis.VITE_SIGNALING_BASE_URL ?? "/api/v1";
const headers = { "Content-Type": "application/json" };

export const PEER_DISCONNECT_REASONS = Object.freeze({
  CLOSED: "connection-closed",
  FAILED: "connection-failed",
  LOCAL_REQUEST: "local-request",
  REMOTE_REQUEST: "remote-request",
  TIMEOUT: "disconnected-timeout",
});

export const DEFAULT_DISCONNECTED_GRACE_PERIOD_MS = 12_000;

const intentionallyClosedPeerConnections = new WeakSet();

export async function storeSDP(sdp) {
  const response = await fetch(`${baseURL}/exchange`, {
    method: "POST",
    headers,
    body: JSON.stringify(sdp),
  });
  return await response.json();
}

export async function loadSDP(type) {
  const response = await fetch(`${baseURL}/exchange?type=${type}`, {
    method: "GET",
    headers,
  });
  return await response.json();
}

export function closePeerConnection(pc) {
  if (!pc || pc.connectionState === "closed") return;
  intentionallyClosedPeerConnections.add(pc);
  pc.close();
}

export function getNewPC({
  onConnect,
  onDisconnect,
  onConnectionInterrupted,
  onConnectionRecovered,
  onTrack,
  stream,
  disconnectedGracePeriodMs = DEFAULT_DISCONNECTED_GRACE_PERIOD_MS,
}) {
  const pc = new RTCPeerConnection();
  let disconnectedTimer = null;
  let isInterrupted = false;
  let hasConnected = false;
  let terminalDisconnectNotified = false;

  function clearDisconnectedTimer() {
    if (disconnectedTimer === null) return;
    clearTimeout(disconnectedTimer);
    disconnectedTimer = null;
  }

  function notifyTerminalDisconnect(reason) {
    if (terminalDisconnectNotified) return;
    terminalDisconnectNotified = true;
    clearDisconnectedTimer();
    onDisconnect(pc, reason);
  }

  pc.onconnectionstatechange = () => {
    if (terminalDisconnectNotified) return;

    if (pc.connectionState === "connected") {
      clearDisconnectedTimer();
      const recoveredFromInterruption = isInterrupted;
      isInterrupted = false;
      if (!hasConnected) {
        hasConnected = true;
        onConnect(pc);
      } else if (recoveredFromInterruption) {
        onConnectionRecovered?.(pc);
      }
      return;
    }

    if (pc.connectionState === "disconnected") {
      if (disconnectedTimer !== null) return;
      isInterrupted = true;
      onConnectionInterrupted?.(pc);
      disconnectedTimer = setTimeout(() => {
        disconnectedTimer = null;
        if (pc.connectionState === "disconnected") {
          notifyTerminalDisconnect(PEER_DISCONNECT_REASONS.TIMEOUT);
        }
      }, disconnectedGracePeriodMs);
      return;
    }

    if (pc.connectionState === "failed") {
      notifyTerminalDisconnect(PEER_DISCONNECT_REASONS.FAILED);
      return;
    }

    if (pc.connectionState === "closed") {
      if (intentionallyClosedPeerConnections.delete(pc)) {
        terminalDisconnectNotified = true;
        clearDisconnectedTimer();
        return;
      }
      notifyTerminalDisconnect(PEER_DISCONNECT_REASONS.CLOSED);
    }
  };
  if (stream) stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  if (onTrack) pc.ontrack = (event) => onTrack(event, pc);
  return pc;
}

export function attachDataChannel(pc, dataChannel, onMessage) {
  if (dataChannel) {
    dataChannel.onopen = () => {
      pc.dataChannel = dataChannel;
      pc.dataChannel.onmessage = (event) => onMessage(event.data, pc);
    };
  } else {
    pc.ondatachannel = (event) =>
      (event.channel.onopen = () => {
        pc.dataChannel = event.channel;
        pc.dataChannel.onmessage = (event) => onMessage(event.data, pc);
      });
  }
}

export async function waitForIceGatheringCompletion(pc) {
  return new Promise((resolve) => {
    function checkGatheringState() {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", checkGatheringState);
        return resolve(pc.iceGatheringState);
      }
      pc.addEventListener("icegatheringstatechange", checkGatheringState);
    }
    checkGatheringState();
  });
}

export async function createAndStoreOfferWhilePolling(pc, isPolling = () => false) {
  pc.setLocalDescription(await pc.createOffer());
  await waitForIceGatheringCompletion(pc);
  while (isPolling()) {
    const response = await storeSDP(pc.localDescription);
    if (response?.status === "offer-stored") break;
  }
  if (!isPolling()) closeAllPCsAndRevokeSDP([pc]);
}

export async function loadAndApplyAnswerWhilePolling(pc, isPolling = () => false, isTrustedParent) {
  while (isPolling()) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const answer = await loadSDP("answer");
    if (answer?.type !== "answer") continue;
    if (!(await isTrustedParent(answer.parentID))) {
      await storeSDP(pc.localDescription);
      continue;
    } else pc.parentID = answer.parentID;
    await pc.setRemoteDescription(answer.sdp);
    break;
  }
  if (!pc.remoteDescription) closeAllPCsAndRevokeSDP([pc]);
}

export async function closeAllPCsAndRevokeSDP(pcs) {
  pcs.forEach(closePeerConnection);
  await storeSDP({ type: null });
}

export function sendMessage(msg, pc) {
  if (pc?.dataChannel && pc.dataChannel?.readyState === "open") {
    pc.dataChannel.send(msg);
  } else console.error("Message Not Sent: " + msg);
}
