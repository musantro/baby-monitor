import { Camera, CameraOff, Fullscreen, Video, VideoOff, Volume2, VolumeOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { attachDataChannel, getNewPC, loadSDP, sendMessage, storeSDP, waitForIceGatheringCompletion } from "../services/connex";
import { createPlaceholderVideoStream } from "../services/media";
import { getBrowserID } from "../services/settings";
import { useTranslation } from "../i18n";

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
        <div className="container-y no-select" style={{ height: "95vh", justifyContent: "center", alignItems: "center" }}>
            <div className="text-title" style={{ marginBottom: "2em" }}>{t("parent.title")}</div>

            <div className="container-y" style={{ alignItems: "center", maxWidth: "90vw" }}>
                <div className="container-x" style={{ height: "2.25em", justifyContent: "space-between" }}>
                    <div className="container-y" style={{ alignItems: "center", margin: "auto 0.25em" }}>
                        <span>{isParentCameraActive ? <Camera size={18} /> : <CameraOff size={18} />}</span>
                        <div style={{ fontSize: "small" }}>{t("parent.silentVideo")}</div>
                    </div>
                    <div className="container-y" style={{ alignItems: "center", margin: "auto 0.25em" }}>
                        <Fullscreen onClick={() => fullScreen()} style={{ marginLeft: "0.4em", color: isLive ? "white" : "lightgray" }} size={34}>
                            <title>{t("parent.fullscreen")}</title>
                        </Fullscreen>
                    </div>
                    <div className="container-y" style={{ alignItems: "center", margin: "auto 0.25em" }}>
                        {isLive
                            ? <span>
                                <Video style={{ marginRight: "0.4em" }} size={18} />
                                <Volume2 size={18} />
                            </span>
                            : <span>
                                <VideoOff style={{ marginRight: "0.4em" }} size={18} />
                                <VolumeOff size={18} />
                            </span>}
                        <div style={{ fontSize: "small" }}>{t("common.receiving")}</div>
                    </div>
                </div>

                <video ref={videoRef} onPause={() => videoRef.current?.play()} autoPlay playsInline className="video" />

                {isLive && <button onClick={isParentCameraActive ? () => stopParentCamera() : startParentCamera}
                    style={{ background: isParentCameraActive ? "#ff5b00" : "#007bff", width: "auto", marginBottom: "0.75em" }} className="button">
                    {t(isParentCameraActive ? "parent.stopCamera" : "parent.showCamera")}
                </button>}

                <button onClick={button.click} disabled={button.disabled} style={{ background: button.color, width: "auto" }} className="button">
                    {button.text}
                </button>
            </div>
        </div>
    );
}

export default ParentDevice;
