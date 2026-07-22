import { Ban, Camera, CameraOff, Mic, MicOff, Users, Volume2, VolumeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { attachDataChannel, createAndStoreOfferWhilePolling, closeAllPCsAndRevokeSDP, getNewPC, sendMessage, loadAndApplyAnswerWhilePolling } from "../services/connex";
import { audioConfigs } from "../services/media";
import { getSettings, setSettings } from "../services/settings";
import useRefState from "../custom-hooks/useRefState";

function BabyDevice({ showToast }) {
    const settingsRef = useRef(getSettings());
    const pcRef = useRef(null);
    const videoRef = useRef(null);
    const cameraRef = useRef({ cameras: [], count: 0, facingMode: settingsRef.current.startWithFrontCamera ? "user" : { exact: "environment" } });
    const localStreamRef = useRef(null);

    const [isLive, setIsLive, getIsLive] = useRefState(false);
    const [polling, setPolling, getPolling] = useRefState(false);
    const [activeConnections, setActiveConnections, getActiveConnections] = useRefState([]);

    const [button, setButton] = useState({ text: "Start Camera", color: "#007bff", disabled: false, click: startCamera });
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        async function findCameraDevices() {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === "videoinput");
            cameraRef.current = { ...cameraRef.current, cameras, count: cameras.length };
        }
        findCameraDevices();
    }, []);

    async function startCamera() {
        setButton({ ...button, text: "Starting...", disabled: true });
        await loadCameraStream();
        setButton({ text: "Stop Camera", color: "#ff5b00", disabled: false, click: stopCamera });
        setIsLive(true);
        beginPolling();
        await replaceTracksForAllConnections();
    }

    async function beginPolling() {
        setPolling(true);
        setTimeout(() => {
            setPolling(false);
            showToast("Polling stopped!");
            if (getActiveConnections().length === 0) stopCamera();
        }, settingsRef.current.pollingTimeout * 60 * 1000);
        showToast("Waiting for parent connections!");
        while (getPolling()) {
            pcRef.current = getNewPC({ onConnect, onDisconnect, onTrack, stream: localStreamRef.current });
            attachDataChannel(pcRef.current, pcRef.current.createDataChannel("SIGNAL"), onMessage);
            await createAndStoreOfferWhilePolling(pcRef.current, getPolling);
            await loadAndApplyAnswerWhilePolling(pcRef.current, getPolling, isTrustedParent);
        }
    }

    function isTrustedParent(parentID) {
        if (settingsRef.current.trustedParents.includes(parentID)) return true;
        const accepted = confirm(`Unknown parent ${parentID} wants to connect!\nAccept connection and mark as trusted parent?`);
        if (!accepted) return false;
        settingsRef.current.trustedParents.push(parentID);
        setSettings(settingsRef.current);
        return true;
    }

    function onConnect(pc) {
        const acs = getActiveConnections();
        const exists = acs.find(ac => ac.parentID === pc.parentID);
        if (!exists) {
            setActiveConnections([...acs, pc]);
            if (settingsRef.current.maxParentConnections === getActiveConnections().length) {
                setPolling(false);
                closeAllPCsAndRevokeSDP([pcRef.current]);
                pcRef.current = null;
                showToast("Max parent limit reached!");
            } else showToast("Parent device got connected!");
        }
    }

    function onDisconnect(pc) {
        const acs = getActiveConnections();
        const exists = acs.find(ac => ac.parentID === pc.parentID);
        if (exists) {
            setActiveConnections(acs.filter(ac => ac.parentID !== pc.parentID));
            showToast("Parent device got disconnected!");
        }
        if (settingsRef.current.restartPolling && !getPolling() && getIsLive() && getActiveConnections().length === 0) beginPolling();
        pc?.close();
    }

    function onTrack(event) {
        videoRef.current.srcObject.addTrack(event.streams[0].getAudioTracks()[0]);
    }

    function onMessage(message, sender) {
        if (["MUTE", "UNMUTE"].includes(message)) {
            const isPushed = videoRef.current.muted = message !== "UNMUTE";
            const classList = videoRef.current.classList;
            isPushed ? classList.remove("border-glow") : classList.add("border-glow");
            setIsMuted(isPushed);
            return;
        }
        if (message === "DISCONNECT") {
            onDisconnect(sender);
            return;
        }
        console.warn("Unknown Signal: " + message);
    }

    async function loadCameraStream() {
        if (cameraRef.current.count === 0) {
            showToast("No camera found on this device!");
            return;
        }
        let retry = 2;
        while (retry > 0) {
            const mediaConfigs = { video: { facingMode: cameraRef.current.facingMode }, audio: audioConfigs };
            try { localStreamRef.current = await navigator.mediaDevices.getUserMedia(mediaConfigs); break; }
            catch (OverconstrainedError) {
                console.error(OverconstrainedError);
                console.warn("Overriding user settings by switching to Front Camera!");
                cameraRef.current.facingMode = "user";
                showToast("Back camera is not available!");
            }
            retry--;
        }
        videoRef.current.srcObject = new MediaStream(localStreamRef.current.getVideoTracks());
    }

    function stopMediaStreams() {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }

    async function replaceTracksForAllConnections() {
        for (let pc of [...getActiveConnections(), pcRef.current]) {
            if (!pc || pc.connectionState === "closed") continue;
            for (let track of localStreamRef.current.getTracks()) {
                const sender = pc.getSenders().find(s => s.track.kind === track.kind);
                if (sender) await sender.replaceTrack(track);
            }
        }
    }

    async function flipCamera() {
        if (!videoRef.current.srcObject) {
            showToast("Start the camera before flipping!");
            return;
        }
        if (cameraRef.current.count === 1) {
            showToast("Cannot flip with single camera!");
            return;
        }
        setButton({ ...button, text: "Flipping...", disabled: true });
        cameraRef.current.facingMode = cameraRef.current.facingMode === "user" ? { exact: "environment" } : "user";
        const [oldLocalStream, oldVideoStream] = [localStreamRef.current, videoRef.current.srcObject];
        await loadCameraStream();
        await replaceTracksForAllConnections();
        oldVideoStream.getAudioTracks().forEach(track => videoRef.current.srcObject.addTrack(track));
        oldVideoStream.getVideoTracks().forEach(track => track.stop());
        oldLocalStream.getTracks().forEach(track => track.stop());
        setButton({ ...button, text: "Stop Camera", color: "#ff5b00", disabled: false });
        showToast("Flipped to " + (cameraRef.current.facingMode === "user" ? "Front" : "Back") + " Camera!");
    }

    async function stopCamera() {
        const parentCount = getActiveConnections().length;
        if (parentCount > 0) {
            const cancel = !confirm("Disconnect all the parent devices?");
            if (cancel) return;
        }
        setButton({ ...button, text: "Stopping...", disabled: true });
        cleanUp();
        setButton({ text: "Start Camera", color: "#007bff", disabled: false, click: startCamera });
        showToast("Camera stopped! " + (parentCount > 0 ? "All parents disconnected!" : "No parent connected!"));
    }

    const cleanUp = useCallback(() => {
        setIsLive(false);
        setPolling(false);
        getActiveConnections().forEach(ac => sendMessage("DISCONNECT", ac));
        closeAllPCsAndRevokeSDP([...getActiveConnections(), pcRef.current]);
        setActiveConnections([]);
        stopMediaStreams();
    }, [setIsLive, setPolling, setActiveConnections, getActiveConnections]);

    useEffect(() => { return cleanUp; }, [cleanUp]);

    return (
        <div className="container-y no-select" style={{ height: "95vh", justifyContent: "center", alignItems: "center" }}>
            <div className="text-title" style={{ marginBottom: "2em" }}>Baby Device</div>

            <div className="container-y" style={{ alignItems: "center", maxWidth: "90vw" }}>
                <div className="container-x" style={{ height: "2.25em", justifyContent: "space-between" }}>
                    <div className="container-y" style={{ alignItems: "center", margin: "auto 0.25em" }}>
                        {isLive
                            ? <span>
                                <Camera style={{ marginRight: "0.4em" }} size={18} />
                                {isMuted ? <Mic size={18} /> : <MicOff size={18} />}
                            </span>
                            : <span>
                                <CameraOff style={{ marginRight: "0.4em" }} size={18} />
                                <MicOff size={18} />
                            </span>}
                        <div style={{ fontSize: "small" }}>sending</div>
                    </div>
                    <div className="container-y" style={{ alignItems: "center", margin: "auto 0.25em" }}>
                        {(polling || activeConnections.length > 0)
                            ? <span>
                                <Users style={{ marginRight: "0.6em" }} size={18} />
                                <span style={{ display: "inline-block", fontFamily: "Consolas, monospace", fontSize: "larger" }}>
                                    {activeConnections.length}{polling && "+"}
                                </span>
                            </span>
                            : <span><Ban size={18} /></span>}
                        <div style={{ fontSize: "small" }}>connections</div>
                    </div>
                    <div className="container-y" style={{ alignItems: "center", margin: "auto 0.25em" }}>
                        <span>{isMuted ? <VolumeOff size={18} /> : <Volume2 size={18} />}</span>
                        <div style={{ fontSize: "small" }}>recieving</div>
                    </div>
                </div>

                <video ref={videoRef} onClick={flipCamera} muted={isMuted} autoPlay playsInline className="video" />

                <button onClick={button.click} disabled={button.disabled} style={{ background: button.color, width: "auto" }} className="button">
                    {button.text}
                </button>
            </div>
        </div >
    );
}

export default BabyDevice;