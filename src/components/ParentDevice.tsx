import { Camera, CameraOff, Fullscreen, Radio, Video, VideoOff, Volume2, VolumeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { attachDataChannel, getNewPC, loadSDP, sendMessage, storeSDP, waitForIceGatheringCompletion } from "../services/connex";
import { createPlaceholderVideoStream } from "../services/media";
import { getBrowserID } from "../services/settings";
import { useTranslation } from "../i18n";
import AppHeader from "./AppHeader";

function ParentDevice({ showToast }) {
    const t = useTranslation();
    const pcRef = useRef(null);
    const videoRef = useRef(null);
    const placeholderStreamRef = useRef(null);
    const parentCameraStreamRef = useRef(null);

    const [button, setButton] = useState({ text: t("parent.request"), color: "#007bff", disabled: false, click: requestConnection });
    const [isLive, setIsLive] = useState(false);
    const [isParentCameraActive, setIsParentCameraActive] = useState(false);

    async function requestConnection() {
        setButton({ text: t("parent.requesting"), disabled: true });
        if (!pcRef.current) setupPeerConnectionRef();
        await loadOfferAndStoreAnswer();
    }

    function setupPeerConnectionRef() {
        if (pcRef.current?.connectionState === "connected") return;
        placeholderStreamRef.current = createPlaceholderVideoStream();
        pcRef.current = getNewPC({ onConnect, onDisconnect, onTrack, stream: placeholderStreamRef.current });
        attachDataChannel(pcRef.current, null, onMessage);
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
            if (response?.status === "answer-stored") setButton({ text: t("parent.connecting"), disabled: true });
            else onDisconnect(t("parent.requestFailed"));
        } else onDisconnect(t("parent.noBaby"));
    }

    function onConnect() {
        setIsLive(true);
        setButton({ text: t("common.disconnect"), color: "#ff5b00", disabled: false, click: onDisconnect });
        showToast(t("parent.connected"));
    }

    function onDisconnect(toastMsg) {
        if (typeof toastMsg !== "string") toastMsg = t("parent.disconnected");
        setButton({ ...button, text: t("parent.disconnecting"), color: "#ff5b00", disabled: true });
        if (pcRef.current) {
            stopParentCamera(false);
            sendMessage("DISCONNECT", pcRef.current);
            pcRef.current.close();
        }
        pcRef.current = null;
        videoRef.current.srcObject = null;
        setIsLive(false);
        setButton({ text: t("parent.request"), color: "#007bff", disabled: false, click: requestConnection });
        showToast(toastMsg);
    }

    function onTrack(event) {
        videoRef.current.srcObject = event.streams[0];
    }

    function onMessage(message) {
        if (message === "DISCONNECT") {
            onDisconnect(t("parent.offline"));
            return;
        }
        console.warn("Unknown Signal: " + message);
    }

    async function startParentCamera() {
        if (pcRef.current?.connectionState !== "connected") {
            showToast(t("parent.connectFirst"));
            return;
        }
        try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
            parentCameraStreamRef.current = cameraStream;
            const cameraTrack = cameraStream.getVideoTracks()[0];
            if (!cameraTrack) throw new Error("No parent camera track is available");
            const videoSender = pcRef.current.getSenders().find((sender) => sender.track?.kind === "video");
            if (!videoSender) throw new Error("The return video channel was not negotiated");
            await videoSender.replaceTrack(cameraTrack);
            sendMessage("PARENT_CAMERA_START", pcRef.current);
            setIsParentCameraActive(true);
            showToast(t("parent.cameraVisible"));
        } catch (error) {
            console.error(error);
            stopParentCamera(false);
            showToast(t("parent.cameraFailed"));
        }
    }

    async function stopParentCamera(notify = true) {
        const cameraStream = parentCameraStreamRef.current;
        parentCameraStreamRef.current = null;
        const placeholderTrack = placeholderStreamRef.current?.getVideoTracks()[0];
        const videoSender = pcRef.current?.getSenders().find((sender) => sender.track?.kind === "video");
        if (videoSender && placeholderTrack) await videoSender.replaceTrack(placeholderTrack);
        cameraStream?.getTracks().forEach((track) => track.stop());
        if (pcRef.current) sendMessage("PARENT_CAMERA_STOP", pcRef.current);
        setIsParentCameraActive(false);
        if (notify) showToast(t("parent.cameraStopped"));
    }

    function fullScreen() {
        if (!videoRef.current?.srcObject) {
            showToast(t("parent.fullscreenUnavailable"));
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
        stopParentCamera(false);
        placeholderStreamRef.current?.getTracks().forEach(track => track.stop());
    }, []);

    useEffect(() => { return cleanUp; }, [cleanUp]);

    return (
        <div className="app-page monitor-page no-select">
            <AppHeader back />
            <main className="monitor-layout">
                <section className="monitor-heading">
                    <div>
                        <span className={`status-badge ${isLive ? "is-live" : ""}`}><Radio size={14} /> {isLive ? t("common.live") : t("common.standby")}</span>
                        <h1>{t("parent.title")}</h1>
                    </div>
                    <button className="icon-button" onClick={fullScreen} disabled={!isLive} aria-label={t("parent.fullscreen")}>
                        <Fullscreen size={20} />
                    </button>
                </section>
                <section className="video-shell parent-feed">
                    <video ref={videoRef} onPause={() => videoRef.current?.play()} autoPlay playsInline className="video parent-feed-placeholder" />
                    <div className="video-scrim" />
                    <div className="video-label"><span className={isLive ? "live-dot" : "standby-dot"} /> {t("parent.babyRoom")}</div>
                </section>
                <section className="status-grid">
                    <div className="status-card">{isParentCameraActive ? <Camera size={20} /> : <CameraOff size={20} />}<span>{t("parent.silentVideo")}</span></div>
                    <div className="status-card">{isLive ? <Video size={20} /> : <VideoOff size={20} />}<span>{t("common.video")}</span></div>
                    <div className="status-card">{isLive ? <Volume2 size={20} /> : <VolumeOff size={20} />}<span>{t("common.audio")}</span></div>
                </section>
                <div className="monitor-actions">
                    {isLive && <button onClick={isParentCameraActive ? () => stopParentCamera() : startParentCamera}
                        className="button button-secondary">
                        {t(isParentCameraActive ? "parent.stopCamera" : "parent.showCamera")}
                    </button>}
                    <button onClick={button.click} disabled={button.disabled} className={`button ${isLive ? "button-danger" : ""}`}>
                        {button.text}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default ParentDevice;
