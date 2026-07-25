import { Ban, Camera, CameraOff, Radio, RefreshCw, Users, Volume2, VolumeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { attachDataChannel, createAndStoreOfferWhilePolling, closeAllPCsAndRevokeSDP, getNewPC, sendMessage, loadAndApplyAnswerWhilePolling } from "../services/connex";
import { audioConfigs, createTimestampedMediaStream } from "../services/media";
import { getSettings, setSettings } from "../services/settings";
import useRefState from "../custom-hooks/useRefState";
import { useTranslation } from "../i18n";
import AppHeader from "./AppHeader";

function BabyDevice({ showToast }) {
    const t = useTranslation();
    const settingsRef = useRef(getSettings());
    const pcRef = useRef(null);
    const videoRef = useRef(null);
    const parentVideoRef = useRef(null);
    const cameraRef = useRef({ cameras: [], count: 0, facingMode: settingsRef.current.startWithFrontCamera ? "user" : { exact: "environment" } });
    const localStreamRef = useRef(null);
    const cameraStreamRef = useRef(null);
    const timestampRendererRef = useRef(null);
    const activeParentCameraRef = useRef(null);

    const [isLive, setIsLive, getIsLive] = useRefState(false);
    const [polling, setPolling, getPolling] = useRefState(false);
    const [activeConnections, setActiveConnections, getActiveConnections] = useRefState([]);

    const [button, setButton] = useState({ text: t("baby.start"), color: "#007bff", disabled: false, click: startCamera });
    const [isMuted, setIsMuted] = useState(true);
    const [isParentCameraActive, setIsParentCameraActive] = useState(false);

    useEffect(() => {
        async function findCameraDevices() {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(device => device.kind === "videoinput");
            cameraRef.current = { ...cameraRef.current, cameras, count: cameras.length };
        }
        findCameraDevices();
    }, []);

    async function startCamera() {
        setButton({ ...button, text: t("baby.starting"), disabled: true });
        await loadCameraStream();
        setButton({ text: t("baby.stop"), color: "#ff5b00", disabled: false, click: stopCamera });
        setIsLive(true);
        beginPolling();
        await replaceTracksForAllConnections();
    }

    async function beginPolling() {
        setPolling(true);
        setTimeout(() => {
            setPolling(false);
            showToast(t("baby.pollingStopped"));
            if (getActiveConnections().length === 0) stopCamera();
        }, settingsRef.current.pollingTimeout * 60 * 1000);
        showToast(t("baby.waiting"));
        while (getPolling()) {
            pcRef.current = getNewPC({ onConnect, onDisconnect, onTrack, stream: localStreamRef.current });
            attachDataChannel(pcRef.current, pcRef.current.createDataChannel("SIGNAL"), onMessage);
            await createAndStoreOfferWhilePolling(pcRef.current, getPolling);
            await loadAndApplyAnswerWhilePolling(pcRef.current, getPolling, isTrustedParent);
        }
    }

    function isTrustedParent(parentID) {
        if (settingsRef.current.trustedParents.includes(parentID)) return true;
        const accepted = confirm(t("baby.unknownParent", { parentId: parentID }));
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
                showToast(t("baby.maxParents"));
            } else showToast(t("baby.parentConnected"));
        }
    }

    function onDisconnect(pc) {
        const acs = getActiveConnections();
        const exists = acs.find(ac => ac.parentID === pc.parentID);
        if (exists) {
            setActiveConnections(acs.filter(ac => ac.parentID !== pc.parentID));
            showToast(t("baby.parentDisconnected"));
        }
        if (settingsRef.current.restartPolling && !getPolling() && getIsLive() && getActiveConnections().length === 0) beginPolling();
        if (activeParentCameraRef.current === pc) {
            activeParentCameraRef.current = null;
            setIsParentCameraActive(false);
            if (parentVideoRef.current) parentVideoRef.current.srcObject = null;
        }
        pc?.close();
    }

    function onTrack(event, sender) {
        if (event.track.kind === "audio") {
            videoRef.current.srcObject.addTrack(event.track);
            return;
        }
        sender.parentVideoTrack = event.track;
        if (activeParentCameraRef.current === sender) {
            parentVideoRef.current.srcObject = new MediaStream([event.track]);
        }
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
        if (message === "PARENT_CAMERA_START") {
            activeParentCameraRef.current = sender;
            if (sender.parentVideoTrack) parentVideoRef.current.srcObject = new MediaStream([sender.parentVideoTrack]);
            setIsParentCameraActive(true);
            return;
        }
        if (message === "PARENT_CAMERA_STOP") {
            if (activeParentCameraRef.current === sender) {
                activeParentCameraRef.current = null;
                setIsParentCameraActive(false);
                if (parentVideoRef.current) parentVideoRef.current.srcObject = null;
            }
            return;
        }
        console.warn("Unknown Signal: " + message);
    }

    async function loadCameraStream() {
        if (cameraRef.current.count === 0) {
            showToast(t("baby.noCamera"));
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
                showToast(t("baby.backCameraUnavailable"));
            }
            retry--;
        }
        cameraStreamRef.current = localStreamRef.current;
        if (settingsRef.current.showVideoTimestamp) {
            timestampRendererRef.current = await createTimestampedMediaStream(cameraStreamRef.current);
            localStreamRef.current = timestampRendererRef.current.stream;
        }
        videoRef.current.srcObject = new MediaStream(localStreamRef.current.getVideoTracks());
    }

    function stopMediaStreams() {
        timestampRendererRef.current?.stop();
        timestampRendererRef.current = null;
        if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
        localStreamRef.current = null;
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
            showToast(t("baby.startBeforeFlip"));
            return;
        }
        if (cameraRef.current.count === 1) {
            showToast(t("baby.singleCamera"));
            return;
        }
        setButton({ ...button, text: t("baby.flipping"), disabled: true });
        cameraRef.current.facingMode = cameraRef.current.facingMode === "user" ? { exact: "environment" } : "user";
        const [oldCameraStream, oldVideoStream] = [cameraStreamRef.current, videoRef.current.srcObject];
        timestampRendererRef.current?.stop();
        timestampRendererRef.current = null;
        await loadCameraStream();
        await replaceTracksForAllConnections();
        oldVideoStream.getAudioTracks().forEach(track => videoRef.current.srcObject.addTrack(track));
        oldCameraStream.getTracks().forEach(track => track.stop());
        setButton({ ...button, text: t("baby.stop"), color: "#ff5b00", disabled: false });
        showToast(t("baby.flipped", { side: t(cameraRef.current.facingMode === "user" ? "baby.front" : "baby.back") }));
    }

    async function stopCamera() {
        const parentCount = getActiveConnections().length;
        if (parentCount > 0) {
            const cancel = !confirm(t("baby.disconnectAll"));
            if (cancel) return;
        }
        setButton({ ...button, text: t("baby.stopping"), disabled: true });
        cleanUp();
        setButton({ text: t("baby.start"), color: "#007bff", disabled: false, click: startCamera });
        showToast(t(parentCount > 0 ? "baby.stoppedWithParents" : "baby.stoppedWithoutParents"));
    }

    const cleanUp = useCallback(() => {
        setIsLive(false);
        setPolling(false);
        getActiveConnections().forEach(ac => sendMessage("DISCONNECT", ac));
        closeAllPCsAndRevokeSDP([...getActiveConnections(), pcRef.current]);
        setActiveConnections([]);
        activeParentCameraRef.current = null;
        setIsParentCameraActive(false);
        stopMediaStreams();
    }, [setIsLive, setPolling, setActiveConnections, getActiveConnections]);

    useEffect(() => { return cleanUp; }, [cleanUp]);

    return (
        <div className="app-page monitor-page no-select">
            <AppHeader back />
            <main className="monitor-layout">
                <section className="monitor-heading">
                    <div>
                        <span className={`status-badge ${isLive ? "is-live" : ""}`}><Radio size={14} /> {isLive ? t("common.live") : t("common.standby")}</span>
                        <h1>{t("baby.title")}</h1>
                    </div>
                    <button className="icon-button" onClick={flipCamera} disabled={!isLive} aria-label={t("baby.flip")}>
                        <RefreshCw size={20} />
                    </button>
                </section>
                <section className={`video-shell baby-video-stage${isParentCameraActive ? " parent-camera-active" : ""}`}>
                    <video ref={parentVideoRef} muted autoPlay playsInline className="parent-camera-video parent-camera-placeholder" />
                    <video ref={videoRef} onClick={flipCamera} muted={isMuted} autoPlay playsInline className="video baby-camera-video baby-camera-placeholder" />
                    <div className="video-scrim" />
                    <div className="video-label"><span className={isLive ? "live-dot" : "standby-dot"} /> {t("baby.cameraPreview")}</div>
                </section>
                <section className="status-grid">
                    <div className="status-card">
                        {isLive ? <Camera size={20} /> : <CameraOff size={20} />}
                        <span>{t("common.sending")}</span>
                    </div>
                    <div className="status-card">
                        {(polling || activeConnections.length > 0) ? <Users size={20} /> : <Ban size={20} />}
                        <strong>{activeConnections.length}{polling && "+"}</strong><span>{t("common.connections")}</span>
                    </div>
                    <div className="status-card">
                        {isMuted ? <VolumeOff size={20} /> : <Volume2 size={20} />}
                        <span>{t("common.receiving")}</span>
                    </div>
                </section>
                <button onClick={button.click} disabled={button.disabled} className={`button ${isLive ? "button-danger" : ""}`}>
                    {button.disabled && <span className="spinner" />}
                    {button.text}
                </button>
            </main>
        </div>
    );
}

export default BabyDevice;
