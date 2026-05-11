import { useEffect, useState } from "react";
import "../styles/CallOverlay.css";

export type CallType = "voice" | "video";

interface CallOverlayProps {
  type: CallType;
  name: string;
  avatarUrl?: string;
  onEnd: () => void;
}

const PhoneIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const VideoIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const MicIcon = ({ muted, size = 20 }: { muted: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {muted && <line x1="1" y1="1" x2="23" y2="23" />}
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const HangUpIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" transform="rotate(135 12 12)" />
  </svg>
);

const CameraOffIcon = ({ on, size = 20 }: { on: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {!on && <line x1="1" y1="1" x2="23" y2="23" />}
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

export function CallOverlay({ type, name, avatarUrl, onEnd }: CallOverlayProps) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(type === "video");

  useEffect(() => {
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const ringing = seconds < 3;
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="call-overlay" role="dialog" aria-modal="true" aria-label={`${type} call`}>
      <div className="call-card">
        <div className="call-meta">
          <span className="call-type">
            {type === "video" ? <VideoIcon size={14} /> : <PhoneIcon size={14} />}
            {type === "video" ? "Video call" : "Voice call"}
          </span>
          <h2 className="call-name">{name}</h2>
          <span className="call-status">
            {ringing ? "Ringing…" : `Connected · ${minutes}:${secs}`}
          </span>
        </div>

        <div className={`call-avatar ${ringing ? "is-ringing" : ""}`}>
          {avatarUrl ? <img src={avatarUrl} alt={name} /> : <span>{name.charAt(0)}</span>}
          {!ringing && type === "video" && cameraOn && <span className="call-self-cam">You</span>}
        </div>

        <div className="call-controls">
          <button
            type="button"
            className={`call-ctrl ${muted ? "active" : ""}`}
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            <MicIcon muted={muted} />
          </button>

          {type === "video" && (
            <button
              type="button"
              className={`call-ctrl ${!cameraOn ? "active" : ""}`}
              onClick={() => setCameraOn((c) => !c)}
              aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
            >
              <CameraOffIcon on={cameraOn} />
            </button>
          )}

          <button
            type="button"
            className="call-ctrl call-hangup"
            onClick={onEnd}
            aria-label="End call"
          >
            <HangUpIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export { PhoneIcon, VideoIcon };
