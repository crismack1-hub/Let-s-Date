import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { io, Socket } from "socket.io-client";
import { AppSettings } from "./src/components/AppSettings";
import { TabBar, type TabId } from "./src/components/TabBar";
import { CallOverlay, type CallType } from "./src/components/CallOverlay";
import { SmartDiscoveryScreen } from "./src/screens/SmartDiscoveryScreen";
import { VerifiedProfilesScreen } from "./src/screens/VerifiedProfilesScreen";
import { BetterMatchesScreen } from "./src/screens/BetterMatchesScreen";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const DEFAULT_BACKEND_URL =
  Platform.OS === "android" ? "http://10.0.2.2:4000" : "http://localhost:4000";
const BACKEND_URL = process?.env?.EXPO_PUBLIC_API_URL || DEFAULT_BACKEND_URL;
const WEB_URL = process?.env?.EXPO_PUBLIC_WEB_URL || "http://localhost:5173";

const CROSS_PLATFORM = "cross-platform";

type Message = {
  id: string;
  from: string;
  to?: string;
  body: string;
  type?: "text" | "voice-note";
  audioUrl?: string;
  audioDurationMs?: number;
  roomId: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
};

type FeatureLink = {
  id: string;
  icon: string;
  title: string;
  description: string;
  url: string;
};

const featureLinks: FeatureLink[] = [
  {
    id: "smart-discovery",
    icon: "🔍",
    title: "Smart Discovery",
    description: "Filter by age, distance, interests and shared values.",
    url: "https://letsdateapp.com/features/smart-discovery",
  },
  {
    id: "verified-profiles",
    icon: "🛡️",
    title: "Verified Profiles",
    description: "Match only with identity-checked, real people.",
    url: "https://letsdateapp.com/features/verified-profiles",
  },
  {
    id: "real-conversations",
    icon: "💬",
    title: "Real Conversations",
    description: "Real-time messaging with real humans — no bots, no AI.",
    url: "https://letsdateapp.com/features/real-conversations",
  },
  {
    id: "better-matches",
    icon: "💞",
    title: "Better Matches",
    description: "New people, ranked by compatibility you can see.",
    url: "https://letsdateapp.com/features/better-matches",
  },
];

const newId = () =>
  typeof globalThis !== "undefined" &&
  (globalThis as any).crypto?.randomUUID
    ? (globalThis as any).crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function App() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentPage, setCurrentPage] = useState<TabId>("home");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageBuckets, setMessageBuckets] = useState<Record<string, Message[]>>({});
  const [currentMessage, setCurrentMessage] = useState("");
  const [callType, setCallType] = useState<CallType | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState(0);
  const selectedChatRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  selectedChatRef.current = selectedChat;
  currentUserIdRef.current = currentUserId;

  const socketClient = useMemo(() => {
    if (!token) return null;
    return io(BACKEND_URL, { auth: { token } });
  }, [token]);

  useEffect(() => {
    if (!socketClient) return;
    setSocket(socketClient);

    socketClient.on("connect", () => {
      socketClient.emit("join-room", "cross-platform-chat");
    });

    socketClient.on("message", (message: Message) => {
      if (message.roomId === "cross-platform-chat") {
        setMessageBuckets((prev) => ({
          ...prev,
          [CROSS_PLATFORM]: [...(prev[CROSS_PLATFORM] ?? []), message],
        }));
        return;
      }

      const me = currentUserIdRef.current;
      const bucketKey =
        message.from && message.from !== me
          ? message.from
          : message.to && message.to !== me
            ? message.to
            : null;
      if (bucketKey) {
        setMessageBuckets((prev) => ({
          ...prev,
          [bucketKey]: [...(prev[bucketKey] ?? []), message],
        }));
      }
    });

    return () => {
      socketClient.disconnect();
    };
  }, [socketClient]);

  // After login, fetch profile + conversations.
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [profileRes, convsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BACKEND_URL}/api/conversations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (profileRes.ok) {
          const p = await profileRes.json();
          setCurrentUserId(p.id ?? null);
        }
        setConvsLoading(true);
        if (convsRes.ok) {
          const c = await convsRes.json();
          setConversations(c);
        }
      } catch (e) {
        console.warn("post-login fetch", e);
      } finally {
        setConvsLoading(false);
      }
    })();
  }, [token]);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const body = await response.json();
      if (!response.ok) {
        alert(body.error || "Login failed");
        return;
      }
      setToken(body.token);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Unable to reach the server. Make sure the backend is running.");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUserId(null);
    setConversations([]);
    setMessageBuckets({});
    setSelectedChat(null);
    setPhone("");
    setPassword("");
    setCurrentPage("home");
  };

  const openChat = (chatId: string) => {
    setSelectedChat(chatId);
    if (chatId !== CROSS_PLATFORM && socket) {
      socket.emit("join-room", `direct-${chatId}`);
    }
  };

  const handleSend = () => {
    if (!socket || !currentMessage.trim() || !selectedChat) return;
    const body = currentMessage.trim();
    const roomId =
      selectedChat === CROSS_PLATFORM ? "cross-platform-chat" : `direct-${selectedChat}`;

    socket.emit("direct-message", {
      to: selectedChat,
      body,
      roomId,
      type: "text",
    });

    setCurrentMessage("");
  };

  const startVoiceNote = async () => {
    if (!socket || !selectedChat || isRecording) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        alert("Microphone access is needed to record a voice note.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
      setRecordingStartedAt(Date.now());
      setIsRecording(true);
    } catch (error) {
      console.error("Start voice note failed:", error);
      alert("Unable to start recording.");
    }
  };

  const stopVoiceNote = async () => {
    if (!recording || !socket || !selectedChat) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) return;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const roomId =
        selectedChat === CROSS_PLATFORM ? "cross-platform-chat" : `direct-${selectedChat}`;

      socket.emit("direct-message", {
        to: selectedChat,
        body: "Voice note",
        roomId,
        type: "voice-note",
        audioUrl: `data:audio/m4a;base64,${base64}`,
        audioDurationMs: Date.now() - recordingStartedAt,
      });
    } catch (error) {
      console.error("Stop voice note failed:", error);
      alert("Unable to send voice note.");
    }
  };

  const playVoiceNote = async (audioUrl: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      await sound.playAsync();
    } catch (error) {
      console.error("Play voice note failed:", error);
      alert("Unable to play this voice note.");
    }
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.shell}>
        <ScrollView contentContainerStyle={styles.loginContent}>
          <View style={styles.brandRow}>
            <Text style={styles.brandHeart}>💕</Text>
            <Text style={styles.brandWord}>Let's Date</Text>
          </View>
          <Text style={styles.heroHeadline}>Real people. Real connections.</Text>
          <Text style={styles.heroSub}>
            Identity-verified profiles, human conversations, no bots. Get started on
            our website — the app is for chatting once you're signed up.
          </Text>

          <View style={styles.entryCard}>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => Linking.openURL(WEB_URL)}
            >
              <Text style={styles.primaryBtnText}>Open the website →</Text>
            </Pressable>

            <Pressable
              style={[styles.secondaryBtn, styles.entryRegisterBtn]}
              onPress={() => Linking.openURL(`${WEB_URL}/?signup=1`)}
            >
              <Text style={styles.secondaryBtnText}>Create an account</Text>
            </Pressable>

            <Text style={styles.entryNote}>
              Registration, profile photos and matching all happen on the website.
              Use this app to chat once you're in.
            </Text>
          </View>

          {showSignIn ? (
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone"
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.formLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                placeholderTextColor="#9ca3af"
              />

              <Pressable style={styles.primaryBtn} onPress={handleLogin}>
                <Text style={styles.primaryBtnText}>Sign in</Text>
              </Pressable>

              <Pressable
                style={styles.ghostLink}
                onPress={() => setShowSignIn(false)}
              >
                <Text style={styles.ghostLinkText}>Hide sign in</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.ghostLink}
              onPress={() => setShowSignIn(true)}
            >
              <Text style={styles.ghostLinkText}>
                Already have an account? Sign in →
              </Text>
            </Pressable>
          )}

          <View style={styles.featureSection}>
            <Text style={styles.sectionEyebrow}>Explore</Text>
            <Text style={styles.sectionTitle}>Key features</Text>
            {featureLinks.map((f) => (
              <Pressable
                key={f.id}
                style={styles.featureItem}
                onPress={() => Linking.openURL(f.url)}
              >
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View style={styles.featureBody}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureText}>{f.description}</Text>
                </View>
                <Text style={styles.featureArrow}>→</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentPage === "settings") {
    return (
      <AppSettings
        onLogout={handleLogout}
        onBackToApp={() => setCurrentPage("home")}
      />
    );
  }

  const renderHome = () => {
    if (selectedChat) {
      const isCross = selectedChat === CROSS_PLATFORM;
      const conv = conversations.find((c) => c.userId === selectedChat);
      const messages = messageBuckets[selectedChat] ?? [];
      const headerName = isCross ? "📱 Mobile app" : conv?.userName ?? "Chat";
      const headerSub = isCross
        ? "Connected to the website"
        : conv?.online
          ? "● Online now"
          : "Offline";

      return (
        <View style={styles.homeWrap}>
          <View style={styles.threadHeader}>
            <Pressable onPress={() => setSelectedChat(null)} hitSlop={8}>
              <Text style={styles.backArrow}>‹</Text>
            </Pressable>
            <View style={styles.threadHeaderText}>
              <Text style={styles.threadHeaderName}>{headerName}</Text>
              <Text style={styles.threadHeaderSub}>{headerSub}</Text>
            </View>
            <Pressable
              style={styles.callIconBtn}
              onPress={() => setCallType("voice")}
              accessibilityLabel="Start voice call"
              hitSlop={6}
            >
              <Feather name="phone" size={18} color="#14142b" />
            </Pressable>
            <Pressable
              style={[styles.callIconBtn, styles.callIconBtnVideo]}
              onPress={() => setCallType("video")}
              accessibilityLabel="Start video call"
              hitSlop={6}
            >
              <Feather name="video" size={18} color="#14142b" />
            </Pressable>
          </View>

          <ScrollView style={styles.chat}>
            {messages.map((m) => {
              const mine = m.from === currentUserId || m.from === "me";
              return (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    mine ? styles.bubbleMine : styles.bubbleTheirs,
                  ]}
                >
                  {m.type === "voice-note" && m.audioUrl ? (
                    <Pressable
                      style={styles.voiceNoteBubble}
                      onPress={() => playVoiceNote(m.audioUrl!)}
                    >
                      <Feather
                        name="play-circle"
                        size={22}
                        color={mine ? "#fff" : "#14142b"}
                      />
                      <Text style={mine ? styles.bubbleTextMine : styles.bubbleText}>
                        Voice note
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={mine ? styles.bubbleTextMine : styles.bubbleText}>{m.body}</Text>
                  )}
                  <Text style={mine ? styles.bubbleTimeMine : styles.bubbleTime}>
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.inputArea}>
            <Pressable
              style={[styles.voiceBtn, isRecording && styles.voiceBtnRecording]}
              onPress={isRecording ? stopVoiceNote : startVoiceNote}
              accessibilityLabel={isRecording ? "Stop and send voice note" : "Record voice note"}
            >
              <Feather name={isRecording ? "square" : "mic"} size={18} color="#fff" />
            </Pressable>
            <TextInput
              style={styles.messageInput}
              value={currentMessage}
              onChangeText={setCurrentMessage}
              placeholder="Say something nice…"
              placeholderTextColor="#9ca3af"
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable style={styles.sendBtn} onPress={handleSend}>
              <Text style={styles.sendBtnText}>Send</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    // List view
    const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);
    return (
      <View style={styles.homeWrap}>
        <View style={styles.modernHeader}>
          <Pressable
            onPress={() => setCurrentPage("home")}
            accessibilityLabel="Let's Date — go to home"
            hitSlop={6}
          >
            <Text style={styles.headerLogo}>💕 Messages</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerChip}
              onPress={() => Linking.openURL(WEB_URL)}
            >
              <Text style={styles.headerChipText}>🌐 Web</Text>
            </Pressable>
            <Pressable
              style={[styles.headerChip, styles.headerChipDanger]}
              onPress={handleLogout}
              accessibilityLabel="Sign out"
            >
              <Text style={[styles.headerChipText, styles.headerChipDangerText]}>
                Sign out
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          <View style={styles.listSummary}>
            <Text style={styles.listSummaryStrong}>
              {conversations.length} chat{conversations.length === 1 ? "" : "s"}
            </Text>
            <Text style={styles.listSummaryMeta}>
              {totalUnread > 0 ? `${totalUnread} unread` : "All caught up"}
            </Text>
          </View>

          <Pressable
            style={[
              styles.row,
              styles.rowCross,
              selectedChat === CROSS_PLATFORM && styles.rowActive,
            ]}
            onPress={() => openChat(CROSS_PLATFORM)}
          >
            <View style={styles.rowAvatarBox}>
              <Text style={styles.rowAvatarEmoji}>📱</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>Website chat</Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                Cross-platform — chat with people on the website
              </Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </Pressable>

          {convsLoading ? (
            <Text style={styles.listEmpty}>Loading your chats…</Text>
          ) : conversations.length === 0 ? (
            <View style={styles.listEmptyBox}>
              <Text style={styles.listEmptyTitle}>No chats yet</Text>
              <Text style={styles.listEmptyText}>
                Like someone in Discover and they'll show up here once you match.
              </Text>
            </View>
          ) : (
            conversations.map((c) => (
              <Pressable
                key={c.id}
                style={styles.row}
                onPress={() => openChat(c.userId)}
              >
                <View style={styles.rowAvatarBox}>
                  {c.userPhoto ? (
                    <Image source={{ uri: c.userPhoto }} style={styles.rowAvatarImg} />
                  ) : (
                    <Text style={styles.rowAvatarEmoji}>👤</Text>
                  )}
                  {c.online && <View style={styles.rowOnline} />}
                </View>
                <View style={styles.rowText}>
                  <View style={styles.rowTopRow}>
                    <Text style={styles.rowName}>{c.userName}</Text>
                    <Text style={styles.rowTime}>
                      {new Date(c.lastMessageTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {c.lastMessage || "Say hi to start the conversation."}
                  </Text>
                </View>
                {c.unreadCount > 0 && (
                  <View style={styles.unreadDot}>
                    <Text style={styles.unreadDotText}>{c.unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const renderPlaceholder = (
    emoji: string,
    title: string,
    blurb: string,
  ) => (
    <View style={styles.homeWrap}>
      <View style={styles.modernHeader}>
        <Text style={styles.headerLogo}>{title}</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerChip}
            onPress={() => Linking.openURL(WEB_URL)}
          >
            <Text style={styles.headerChipText}>🌐 Web</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.placeholderBody}>
        <Text style={styles.placeholderEmoji}>{emoji}</Text>
        <Text style={styles.placeholderTitle}>{title}</Text>
        <Text style={styles.placeholderText}>{blurb}</Text>
      </View>
    </View>
  );

  const renderScreen = () => {
    if (currentPage === "smart-discovery") {
      return (
        <SmartDiscoveryScreen
          token={token}
          backendUrl={BACKEND_URL}
          onNavigate={setCurrentPage}
        />
      );
    }
    if (currentPage === "verified-profiles") {
      return (
        <VerifiedProfilesScreen
          token={token}
          backendUrl={BACKEND_URL}
          onNavigate={setCurrentPage}
        />
      );
    }
    if (currentPage === "better-matches") {
      return (
        <BetterMatchesScreen
          token={token}
          backendUrl={BACKEND_URL}
          onNavigate={setCurrentPage}
        />
      );
    }
    if (currentPage === "status") {
      return renderPlaceholder(
        "◉",
        "Status",
        "Share updates that disappear after 24 hours. Coming soon.",
      );
    }
    if (currentPage === "calls") {
      return renderPlaceholder(
        "📞",
        "Calls",
        "Your recent voice and video calls will appear here.",
      );
    }
    return renderHome();
  };

  const handleTabChange = (tab: TabId) => {
    if (tab === "web") {
      Linking.openURL(WEB_URL);
      return;
    }
    setCurrentPage(tab);
  };

  const callPartner =
    selectedChat === CROSS_PLATFORM
      ? { name: "Website chat", avatar: undefined as string | undefined }
      : (() => {
          const c = conversations.find((c) => c.userId === selectedChat);
          return { name: c?.userName ?? "Someone", avatar: c?.userPhoto };
        })();

  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.flex}>{renderScreen()}</View>
      <TabBar active={currentPage} onChange={handleTabChange} />
      {callType && (
        <CallOverlay
          type={callType}
          name={callPartner.name}
          avatarUrl={callPartner.avatar}
          onEnd={() => setCallType(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#fafbfc",
  },
  flex: { flex: 1 },
  homeWrap: { flex: 1 },
  loginContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 32,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 28,
  },
  brandHeart: { fontSize: 26 },
  brandWord: {
    fontSize: 18,
    fontWeight: "700",
    color: "#14142b",
    letterSpacing: -0.3,
  },
  heroHeadline: {
    fontSize: 30,
    fontWeight: "700",
    color: "#14142b",
    letterSpacing: -0.6,
    lineHeight: 36,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#ececf2",
    shadowColor: "#14142b",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  entryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#ececf2",
    shadowColor: "#14142b",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    gap: 10,
    marginBottom: 16,
  },
  entryRegisterBtn: {
    marginTop: 4,
  },
  entryNote: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#14142b",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ececf2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    backgroundColor: "#fafbfc",
    color: "#14142b",
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: "#ff5a6e",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#ececf2" },
  dividerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#ff5a6e",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#ff5a6e", fontWeight: "700", fontSize: 15 },
  signupHint: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 18,
  },
  ghostLink: { marginTop: 12, alignItems: "center" },
  ghostLinkText: { color: "#6b7280", fontWeight: "500", fontSize: 14 },
  featureSection: { marginTop: 28 },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#14142b",
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ececf2",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  featureIcon: { fontSize: 22 },
  featureBody: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: "700", color: "#14142b", marginBottom: 2 },
  featureText: { fontSize: 13, color: "#6b7280", lineHeight: 18 },
  featureArrow: { fontSize: 18, color: "#9ca3af", fontWeight: "600" },

  modernHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#ececf2",
  },
  headerLogo: {
    fontSize: 17,
    fontWeight: "700",
    color: "#14142b",
    letterSpacing: -0.3,
  },
  headerActions: { flexDirection: "row", gap: 8 },
  headerChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#f0f1f4",
  },
  headerChipText: { color: "#14142b", fontWeight: "600", fontSize: 13 },
  headerChipDanger: {
    backgroundColor: "#fee2e2",
  },
  headerChipDangerText: {
    color: "#b91c1c",
  },
  placeholderBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 8,
  },
  placeholderEmoji: { fontSize: 52, marginBottom: 4 },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#14142b",
    letterSpacing: -0.3,
  },
  placeholderText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },

  /* Conversation list */
  list: { flex: 1 },
  listContent: { padding: 14, gap: 8 },
  listSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  listSummaryStrong: { fontSize: 14, color: "#14142b", fontWeight: "600" },
  listSummaryMeta: { fontSize: 12, color: "#6b7280" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ececf2",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  rowCross: {
    borderColor: "#cdebf5",
    backgroundColor: "#f0fbfa",
  },
  rowActive: {
    borderColor: "#ff5a6e",
    backgroundColor: "#fff5f7",
  },
  rowAvatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f1f4",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  rowAvatarImg: { width: "100%", height: "100%" },
  rowAvatarEmoji: { fontSize: 24 },
  rowOnline: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2bb673",
    borderWidth: 2,
    borderColor: "#fff",
  },
  rowText: { flex: 1, minWidth: 0 },
  rowTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  rowName: { fontSize: 15, fontWeight: "700", color: "#14142b" },
  rowTime: { fontSize: 11, color: "#9ca3af" },
  rowMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  rowArrow: { fontSize: 18, color: "#9ca3af", fontWeight: "600" },
  unreadDot: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ff5a6e",
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDotText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  listEmpty: { color: "#6b7280", textAlign: "center", padding: 16 },
  listEmptyBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ececf2",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    gap: 4,
  },
  listEmptyTitle: { fontSize: 15, fontWeight: "700", color: "#14142b" },
  listEmptyText: { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 18 },

  /* Thread view */
  threadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ececf2",
  },
  backArrow: { fontSize: 28, color: "#14142b", paddingHorizontal: 6, lineHeight: 28 },
  threadHeaderText: { flex: 1, minWidth: 0 },
  threadHeaderName: { fontSize: 15, fontWeight: "700", color: "#14142b" },
  threadHeaderSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  threadAvatar: { width: 36, height: 36, borderRadius: 18 },
  threadAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f1f4",
    alignItems: "center",
    justifyContent: "center",
  },
  threadAvatarFallbackText: { fontSize: 18 },
  callIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ececf2",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  callIconBtnVideo: {
    borderColor: "#cdebf5",
    backgroundColor: "#f0fbfa",
  },

  chat: { flex: 1, paddingHorizontal: 12, paddingTop: 10 },
  chatEmptyContent: { flexGrow: 1, justifyContent: "center" },
  emptyState: { alignItems: "center", paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 38, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#14142b", marginBottom: 4, textAlign: "center" },
  emptyText: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20 },

  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    marginBottom: 8,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: "#ff5a6e",
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ececf2",
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: "#14142b", fontSize: 15, lineHeight: 20 },
  bubbleTextMine: { color: "#fff", fontSize: 15, lineHeight: 20 },
  voiceNoteBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 132,
  },
  bubbleTime: { color: "#9ca3af", fontSize: 11, marginTop: 4, alignSelf: "flex-end" },
  bubbleTimeMine: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 4, alignSelf: "flex-end" },

  inputArea: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#ececf2",
  },
  voiceBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#14142b",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBtnRecording: {
    backgroundColor: "#dc2626",
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ececf2",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fafbfc",
    color: "#14142b",
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: "#ff5a6e",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    justifyContent: "center",
  },
  sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
