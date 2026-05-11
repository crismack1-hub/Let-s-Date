import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export type CallType = "voice" | "video";

interface CallOverlayProps {
  type: CallType;
  name: string;
  avatarUrl?: string;
  onEnd: () => void;
}

export function CallOverlay({ type, name, avatarUrl, onEnd }: CallOverlayProps) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(type === "video");

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const ringing = seconds < 3;
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onEnd}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.meta}>
            <View style={styles.typePill}>
              <Feather name={type === "video" ? "video" : "phone"} size={12} color="#fff" />
              <Text style={styles.typePillText}>
                {type === "video" ? "Video call" : "Voice call"}
              </Text>
            </View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.status}>
              {ringing ? "Ringing…" : `Connected · ${minutes}:${secs}`}
            </Text>
          </View>

          <View style={styles.avatarWrap}>
            {ringing && <View style={styles.pulseA} />}
            {ringing && <View style={styles.pulseB} />}
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            {!ringing && type === "video" && cameraOn && (
              <View style={styles.selfCam}>
                <Text style={styles.selfCamText}>You</Text>
              </View>
            )}
          </View>

          <View style={styles.controls}>
            <Pressable
              style={[styles.ctrl, muted && styles.ctrlActive]}
              onPress={() => setMuted((m) => !m)}
              accessibilityLabel={muted ? "Unmute" : "Mute"}
            >
              <Feather
                name={muted ? "mic-off" : "mic"}
                size={22}
                color={muted ? "#14142b" : "#fff"}
              />
            </Pressable>

            {type === "video" && (
              <Pressable
                style={[styles.ctrl, !cameraOn && styles.ctrlActive]}
                onPress={() => setCameraOn((c) => !c)}
                accessibilityLabel={cameraOn ? "Turn camera off" : "Turn camera on"}
              >
                <Feather
                  name={cameraOn ? "video" : "video-off"}
                  size={22}
                  color={cameraOn ? "#fff" : "#14142b"}
                />
              </Pressable>
            )}

            <Pressable
              style={styles.hangup}
              onPress={onEnd}
              accessibilityLabel="End call"
            >
              <Feather name="phone-off" size={26} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20,20,43,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#1d1f33",
    borderRadius: 28,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 22,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  meta: {
    alignItems: "center",
    gap: 6,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  typePillText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginTop: 4,
  },
  status: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
  },
  avatarWrap: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: "hidden",
    backgroundColor: "#ff5a6e",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarLetter: {
    color: "#fff",
    fontSize: 56,
    fontWeight: "700",
  },
  pulseA: {
    position: "absolute",
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 2,
    borderColor: "rgba(255,90,110,0.55)",
    opacity: 0.9,
  },
  pulseB: {
    position: "absolute",
    width: 174,
    height: 174,
    borderRadius: 87,
    borderWidth: 2,
    borderColor: "rgba(255,90,110,0.35)",
    opacity: 0.7,
  },
  selfCam: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  selfCamText: {
    color: "#14142b",
    fontWeight: "700",
    fontSize: 11,
  },
  controls: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  ctrl: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctrlActive: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  hangup: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ff3b3b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff3b3b",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
