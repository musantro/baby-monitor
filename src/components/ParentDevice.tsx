import { Fullscreen, Mic, MicOff, Video, VideoOff, Volume2, VolumeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { attachDataChannel, getNewPC, loadSDP, sendMessage, storeSDP, waitForIceGatheringCompletion } from "../services/connex";
import { audioConfigs } from "../services/media";
import { getBrowserID, getSettings } from "../services/settings";

function ParentDevice({ showToast }) {
    const pcRef = useRef(null);
    const videoRef = useRef(null);
    const settingsRef = useRef(getSettings());
    const micRef = useRef({ stream: null, track: null });

    const [button, setButton] = useState({ text: "Request Connection", color: "#007bff", disabled: false, click: requestConnection });
    const [isLive, setIsLive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    async function requestConnection() {
        setButton({ text: "Requesting...", disabled: true });
        if (settingsRef.current.usePushToTalk && !micRef.current.stream) {
            micRef.current.stream = await navigator.mediaDevices.getUserMedia({ audio: audioConfigs });
            micRef.current.track = micRef.current.stream.getAudioTracks()[0];
        }
        if (!pcRef.current) setupPeerConnectionRef();
        await loadOfferAndStoreAnswer();
    }

    function setupPeerConnectionRef() {
        if (pcRef.current?.connectionState === "connected") return;
        pcRef.current = getNewPC({ onConnect, onDisconnect, onTrack, stream: micRef.current.stream });
        attachDataChannel(pcRef.current, null, onMessage);
        if (micRef.current.track) micRef.current.track.enabled = false;
    }

    async function loadOfferAndStoreAnswer() {
        const offer = await loadSDP("offer");
        if (offer?.type === "offer") {
            await pcRef.current.setRemoteDescription(offer);
            await pcRef.current.setLocalDescription(await pcRef.current.createAnswer());
            await waitForIceGatheringCompletion(pcRef.current);
            const response = await storeSDP({
                type: "answer",
                parentID: getBrowserID(),
                sdp: pcRef.current.localDescription
            });
            if (response?.status === "answer-stored") setButton({ text: "Connecting...", disabled: true });
            else onDisconnect("Connection request failed!");
        } else onDisconnect("No baby device online!");
    }

    function onConnect() {
        setIsLive(true);
        setButton({ text: "Disconnect", color: "#ff5b00", disabled: false, click: onDisconnect });
        showToast("Connected to the baby device!");
    }

    function onDisconnect(toastMsg) {
        if (typeof toastMsg !== "string") toastMsg = "Disconnected from the baby device!";
        setButton({ ...button, text: "Disconnecting...", color: "#ff5b00", disabled: true });
        if (pcRef.current) {
            sendMessage("DISCONNECT", pcRef.current);
            pcRef.current.close();
        }
        pcRef.current = null;
        videoRef.current.srcObject = null;
        setIsLive(false);
        setButton({ text: "Request Connection", color: "#007bff", disabled: false, click: requestConnection });
        showToast(toastMsg);
    }

    function onTrack(event) {
        videoRef.current.srcObject = event.streams[0];
    }

    function onMessage(message) {
        if (message === "DISCONNECT") {
            onDisconnect("Baby device went offline!");
            return;
        }
        console.warn("Unknown Signal: " + message);
    }

    function pushToTalk(isPushed) {
        if (!videoRef.current.srcObject) return;
        if (!settingsRef.current.usePushToTalk) {
            if (isPushed) showToast("Push-To-Talk is disabled!");
            return;
        }
        setIsMuted(isPushed);
        micRef.current.track.enabled = isPushed;
        sendMessage(isPushed ? "UNMUTE" : "MUTE", pcRef.current);
        const classList = videoRef.current.classList;
        isPushed ? classList.add("border-glow") : classList.remove("border-glow");
        showToast(isPushed ? "Baby can hear you now!" : "You can hear the baby!");
    }

    function fullScreen() {
        if (!videoRef.current?.srcObject) {
            showToast("Cannot go fullscreen!");
            return;
        }
        if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
        else if (videoRef.current.webkitRequestFullscreen) videoRef.current.webkitRequestFullscreen();
        else if (videoRef.current.msRequestFullscreen) videoRef.current.msRequestFullscreen();
    }

    const cleanUp = useCallback(() => {
        if (pcRef.current) {
            sendMessage("DISCONNECT", pcRef.current);
            pcRef.current.close();
        }
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (micRef.current.track) micRef.current.track.stop();
    }, []);

    useEffect(() => { return cleanUp; }, [cleanUp]);

    return (
        <div className="container-y no-select" style={{ height: "95vh", justifyContent: "center", alignItems: "center" }}>
            <div className="text-title" style={{ marginBottom: "2em" }}>Parent Device</div>

            <div className="container-y" style={{ alignItems: "center", maxWidth: "90vw" }}>
                <div className="container-x" style={{ height: "2.25em", justifyContent: "space-between" }}>
                    <div className="container-y" style={{ alignItems: "center", margin: "auto 0.25em" }}>
                        <span>{isMuted ? <Mic size={18} /> : <MicOff size={18} />}</span>
                        <div style={{ fontSize: "small" }}>sending</div>
                    </div>
                    <div className="container-y" style={{ alignItems: "center", margin: "auto 0.25em" }}>
                        <Fullscreen onClick={() => fullScreen()} style={{ marginLeft: "0.4em", color: isLive ? "white" : "lightgray" }} size={34}>
                            <title>Watch Fullscreen</title>
                        </Fullscreen>
                    </div>
                    <div className="container-y" style={{ alignItems: "center", margin: "auto 0.25em" }}>
                        {isLive
                            ? <span>
                                <Video style={{ marginRight: "0.4em" }} size={18} />
                                {isMuted ? <VolumeOff size={18} /> : <Volume2 size={18} />}
                            </span>
                            : <span>
                                <VideoOff style={{ marginRight: "0.4em" }} size={18} />
                                <VolumeOff size={18} />
                            </span>}
                        <div style={{ fontSize: "small" }}>recieving</div>
                    </div>
                </div>

                <video ref={videoRef} muted={isMuted} onPause={() => videoRef.current?.play()}
                    onMouseDown={() => pushToTalk(true)} onMouseUp={() => pushToTalk(false)}
                    onTouchStart={() => pushToTalk(true)} onTouchEnd={() => pushToTalk(false)}
                    autoPlay playsInline className="video">
                </video>

                <button onClick={button.click} disabled={button.disabled} style={{ background: button.color, width: "auto" }} className="button">
                    {button.text}
                </button>
            </div>
        </div>
    );
}

export default ParentDevice;