/**
 * useVoiceCall — WebRTC in-app voice calling for HY3N
 *
 * Signaling via Firestore "ride_calls/{rideId}"
 * Audio via WebRTC peer-to-peer (no phone network minutes)
 * ICE candidates use arrayUnion to avoid race conditions
 *
 * Flow:
 *   Caller:  startCall(calleeId)
 *            → creates doc with offer + status:"calling"
 *            → listens for answer + callee ICE
 *   Callee:  idle listener sees status:"calling" + callee_id===myId
 *            → shows IncomingCallModal (isIncoming=true, status="ringing")
 *            → acceptCall() sets up PC, processes offer, writes answer
 *            → both exchange ICE via arrayUnion
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/api/firebaseClient";
import {
  doc, setDoc, updateDoc, onSnapshot, getDoc, arrayUnion,
} from "firebase/firestore";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function useVoiceCall({ rideId, myId, myName, myRole, otherName }) {
  const [status, setStatus] = useState("idle");
  const [isIncoming, setIsIncoming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [duration, setDuration] = useState(0);
  const [callerName, setCallerName] = useState("");
  const [callError, setCallError] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const durationTimerRef = useRef(null);
  const callUnsubRef = useRef(null);
  const idleUnsubRef = useRef(null);
  const callDocRef = useRef(null);
  const isCallerRef = useRef(false);
  const statusRef = useRef("idle");
  const appliedCalleeCands = useRef(0);
  const appliedCallerCands = useRef(0);

  useEffect(() => { statusRef.current = status; }, [status]);

  useEffect(() => {
    if (rideId) callDocRef.current = doc(db, "ride_calls", rideId);
  }, [rideId]);

  useEffect(() => {
    const audio = new Audio();
    audio.autoplay = true;
    audio.playsInline = true;
    remoteAudioRef.current = audio;
    return () => { audio.srcObject = null; };
  }, []);

  useEffect(() => {
    return () => {
      _cleanup();
      if (idleUnsubRef.current) { idleUnsubRef.current(); idleUnsubRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _cleanup = () => {
    if (durationTimerRef.current) { clearInterval(durationTimerRef.current); durationTimerRef.current = null; }
    if (callUnsubRef.current) { callUnsubRef.current(); callUnsubRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    appliedCalleeCands.current = 0;
    appliedCallerCands.current = 0;
    isCallerRef.current = false;
  };

  const _getMic = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
    localStreamRef.current = stream;
    return stream;
  };

  const _applyNewCandidates = async (candidates, countRef) => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    const newOnes = candidates.slice(countRef.current);
    for (const c of newOnes) {
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    countRef.current = candidates.length;
  };

  const _handleEnded = useCallback(() => {
    _cleanup();
    setStatus("ended");
    setIsIncoming(false);
    setIsMuted(false);
    setTimeout(() => setStatus("idle"), 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _createPC = useCallback((isCaller) => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    const pc = new RTCPeerConnection(ICE_SERVERS);
    isCallerRef.current = isCaller;

    pc.ontrack = (e) => {
      if (remoteAudioRef.current && e.streams[0]) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    pc.onicecandidate = async (e) => {
      if (!e.candidate || !callDocRef.current) return;
      const field = isCaller ? "caller_candidates" : "callee_candidates";
      try { await updateDoc(callDocRef.current, { [field]: arrayUnion(e.candidate.toJSON()) }); } catch {}
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setStatus("active");
        setDuration(0);
        durationTimerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        if (callDocRef.current) updateDoc(callDocRef.current, { status: "active" }).catch(() => {});
      }
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) _handleEnded();
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") pc.restartIce();
    };

    pcRef.current = pc;
    return pc;
  }, [_handleEnded]);

  const _subscribeCallDoc = useCallback(() => {
    if (!callDocRef.current) return;
    if (callUnsubRef.current) { callUnsubRef.current(); callUnsubRef.current = null; }

    callUnsubRef.current = onSnapshot(callDocRef.current, async (snap) => {
      if (!snap.exists()) {
        if (["active", "calling", "ringing"].includes(statusRef.current)) _handleEnded();
        return;
      }
      const data = snap.data();

      // Callee: process offer once PC is ready
      if (!isCallerRef.current && data.offer && pcRef.current && !pcRef.current.remoteDescription) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          await updateDoc(callDocRef.current, { answer: answer.toJSON(), status: "answering" });
          await _applyNewCandidates(data.caller_candidates || [], appliedCallerCands);
        } catch (err) { console.error("[VoiceCall] Answer error:", err); }
      }

      // Caller: process answer
      if (isCallerRef.current && data.answer && pcRef.current && !pcRef.current.remoteDescription) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          await _applyNewCandidates(data.callee_candidates || [], appliedCalleeCands);
        } catch (err) { console.error("[VoiceCall] Set answer error:", err); }
      }

      // Both: apply new ICE from other side
      if (pcRef.current && pcRef.current.remoteDescription) {
        if (isCallerRef.current) {
          await _applyNewCandidates(data.callee_candidates || [], appliedCalleeCands);
        } else {
          await _applyNewCandidates(data.caller_candidates || [], appliedCallerCands);
        }
      }

      if (data.status === "ended") _handleEnded();
    });
  }, [_handleEnded]);

  // Idle listener: watch for incoming calls
  useEffect(() => {
    if (!rideId || !myId) return;
    if (idleUnsubRef.current) { idleUnsubRef.current(); idleUnsubRef.current = null; }

    const callRef = doc(db, "ride_calls", rideId);
    idleUnsubRef.current = onSnapshot(callRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status === "calling" && data.callee_id === myId && statusRef.current === "idle") {
        setIsIncoming(true);
        setCallerName(data.caller_name || otherName || "Unknown");
        setStatus("ringing");
        callDocRef.current = callRef;
        _subscribeCallDoc();
      }
    });

    return () => {
      if (idleUnsubRef.current) { idleUnsubRef.current(); idleUnsubRef.current = null; }
    };
  }, [rideId, myId, otherName, _subscribeCallDoc]);

  const startCall = useCallback(async (calleeId) => {
    if (!rideId || !myId || !calleeId) {
      console.warn("[VoiceCall] startCall: missing rideId/myId/calleeId", { rideId, myId, calleeId });
      return;
    }
    if (statusRef.current !== "idle") return;
    setCallError(null);
    setStatus("calling");
    try {
      const stream = await _getMic();
      const pc = _createPC(true);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      const callRef = doc(db, "ride_calls", rideId);
      callDocRef.current = callRef;
      await setDoc(callRef, {
        status: "calling",
        caller_id: myId,
        caller_name: myName,
        caller_role: myRole,
        callee_id: calleeId,
        offer: offer.toJSON(),
        answer: null,
        caller_candidates: [],
        callee_candidates: [],
        created_at: new Date().toISOString(),
      });
      _subscribeCallDoc();
      setTimeout(() => {
        if (statusRef.current === "calling" || statusRef.current === "ringing") endCall();
      }, 30000);
    } catch (err) {
      console.error("[VoiceCall] startCall error:", err);
      setCallError("Could not start call. Check microphone permissions.");
      setStatus("idle");
    }
  }, [rideId, myId, myName, myRole, _createPC, _subscribeCallDoc]);

  const acceptCall = useCallback(async () => {
    if (statusRef.current !== "ringing" || !callDocRef.current) return;
    try {
      const stream = await _getMic();
      const pc = _createPC(false);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      // _subscribeCallDoc will detect the offer and create the answer
      _subscribeCallDoc();
    } catch (err) { console.error("[VoiceCall] acceptCall error:", err); }
  }, [_createPC, _subscribeCallDoc]);

  const endCall = useCallback(async () => {
    try {
      if (callDocRef.current) {
        const snap = await getDoc(callDocRef.current);
        if (snap.exists()) await updateDoc(callDocRef.current, { status: "ended", ended_at: new Date().toISOString() });
      }
    } catch {}
    _handleEnded();
  }, [_handleEnded]);

  const declineCall = useCallback(async () => {
    try {
      if (callDocRef.current) {
        await updateDoc(callDocRef.current, { status: "ended", declined: true, ended_at: new Date().toISOString() });
      }
    } catch {}
    _handleEnded();
  }, [_handleEnded]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeaker(p => !p);
    if (remoteAudioRef.current?.setSinkId) {
      remoteAudioRef.current.setSinkId(isSpeaker ? "default" : "speaker").catch(() => {});
    }
  }, [isSpeaker]);

  const formattedDuration = `${String(Math.floor(duration / 60)).padStart(2, "0")}:${String(duration % 60).padStart(2, "0")}`;

  return {
    status, isIncoming, isMuted, isSpeaker, duration, formattedDuration,
    callerName, callError,
    startCall, acceptCall, declineCall, endCall, toggleMute, toggleSpeaker,
  };
}
