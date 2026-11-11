import { useState, useEffect, useRef } from "react";
import { Conversation, Message } from "../types";
import { apiUrl } from "../api";
import { useSubscription, FREE_DAILY_MESSAGE_LIMIT, TESTING_ACCESS } from "../hooks/useSubscription";
import { CallOverlay, PhoneIcon, VideoIcon, type CallType } from "./CallOverlay";
import "../styles/ChatPage.css";

interface ChatPageProps {
  token: string;
  socket: any;
  currentUserId?: string;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  chatTarget?: string | null;
  onChatTargetConsumed?: () => void;
}

const CROSS_PLATFORM = "cross-platform";
const MAX_ATTACHMENT_SIZE = 512 * 1024;

export function ChatPage({ token, socket, currentUserId, onNavigate, onLogout, chatTarget, onChatTargetConsumed }: ChatPageProps) {
  const { isPremium, canSendMessage, recordMessage, messagesLeftToday } = useSubscription();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(CROSS_PLATFORM);
  const [messageBuckets, setMessageBuckets] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileAppOnline, setMobileAppOnline] = useState(false);
  const [callType, setCallType] = useState<CallType | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showMobileConversationList, setShowMobileConversationList] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [sendingAttachment, setSendingAttachment] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messages = selectedConversation ? messageBuckets[selectedConversation] ?? [] : [];
  const activeConv = conversations.find((c) => c.userId === selectedConversation);

  useEffect(() => {
    fetchConversations();
  }, [token]);

  useEffect(() => {
    if (chatTarget) {
      selectConversation(chatTarget);
      onChatTargetConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatTarget]);

  useEffect(() => {
    if (socket) {
      socket.emit("join-room", "cross-platform-chat");

      const onMessage = (message: Message) => {
        if (message.roomId === "cross-platform-chat") {
          setMessageBuckets((prev) => ({
            ...prev,
            [CROSS_PLATFORM]: [...(prev[CROSS_PLATFORM] ?? []), message],
          }));
          if (message.from && message.from !== currentUserId) setMobileAppOnline(true);
          return;
        }

        // Bucket the message under the OTHER user (so my own sends still land in the right thread).
        const bucketKey =
          message.from && message.from !== currentUserId
            ? message.from
            : message.to && message.to !== currentUserId
              ? message.to
              : null;
        if (bucketKey) {
          setMessageBuckets((prev) => ({
            ...prev,
            [bucketKey]: [...(prev[bucketKey] ?? []), message],
          }));
        }
      };

      socket.on("message", onMessage);

      return () => {
        socket.off("message", onMessage);
      };
    }
  }, [socket, currentUserId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl("/api/conversations"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (userId: string) => {
    setSelectedConversation(userId);
    setShowMobileConversationList(false);

    if (userId === CROSS_PLATFORM) return; // socket-driven

    // Join the direct room so we receive the other side's messages.
    if (socket) socket.emit("join-room", `direct-${userId}`);

    if (messageBuckets[userId]) return; // already loaded

    try {
      const response = await fetch(
        apiUrl(`/api/messages/${userId}`),
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        const data = await response.json();
        setMessageBuckets((prev) => ({ ...prev, [userId]: data }));
      } else {
        setMessageBuckets((prev) => ({ ...prev, [userId]: [] }));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessageBuckets((prev) => ({ ...prev, [userId]: [] }));
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !selectedConversation) return;
    if (!canSendMessage) return;

    const body = newMessage.trim();
    const roomId =
      selectedConversation === CROSS_PLATFORM
        ? "cross-platform-chat"
        : `direct-${selectedConversation}`;

    socket.emit("direct-message", {
      to: selectedConversation,
      roomId,
      body,
      type: "text",
    });

    recordMessage();
    setNewMessage("");
  };

  const getRoomId = () =>
    selectedConversation === CROSS_PLATFORM
      ? "cross-platform-chat"
      : `direct-${selectedConversation}`;

  const sendVoiceNote = (audioUrl: string, audioDurationMs: number) => {
    if (!socket || !selectedConversation || !canSendMessage) return;

    socket.emit("direct-message", {
      to: selectedConversation,
      roomId: getRoomId(),
      body: "Voice note",
      type: "voice-note",
      audioUrl,
      audioDurationMs,
    });

    recordMessage();
  };

  const handleSelectFile = (file?: File) => {
    setAttachmentError(null);
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setSelectedFile(null);
      setAttachmentError("Attachments must be 512 KB or smaller.");
      return;
    }
    setSelectedFile(file);
  };

  const handleSendFile = async () => {
    if (!selectedFile || !socket || !selectedConversation || !canSendMessage || sendingAttachment) return;

    setSendingAttachment(true);
    setAttachmentError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("The selected file could not be read."));
        };
        reader.onerror = () => reject(reader.error ?? new Error("The selected file could not be read."));
        reader.readAsDataURL(selectedFile);
      });
      const name = selectedFile.name.replace(/[\\/\0-\x1f\x7f]/g, "_").slice(0, 255) || "attachment";

      socket.timeout(10000).emit(
        "direct-message",
        {
          to: selectedConversation,
          roomId: getRoomId(),
          body: `Shared a file: ${name}`,
          type: "file",
          attachment: {
            name,
            mimeType: selectedFile.type || "application/octet-stream",
            size: selectedFile.size,
            dataUrl,
          },
        },
        (error: Error | null, response?: { ok: boolean; error?: string }) => {
          setSendingAttachment(false);
          if (error || !response?.ok) {
            setAttachmentError(response?.error ?? "The file could not be sent. Please try again.");
            return;
          }
          recordMessage();
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
      );
    } catch (error) {
      console.error("File attachment could not be read:", error);
      setAttachmentError("The selected file could not be read. Please choose it again.");
      setSendingAttachment(false);
    }
  };

  const handleStartVoiceNote = async () => {
    if (!socket || !selectedConversation || !canSendMessage || isRecording) return;
    setVoiceError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          sendVoiceNote(String(reader.result), Date.now() - recordingStartedAtRef.current);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Voice note recording failed:", error);
      setVoiceError("Microphone access is needed to record a voice note.");
    }
  };

  const handleStopVoiceNote = () => {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    recorderRef.current.stop();
    setIsRecording(false);
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const callPartnerName =
    selectedConversation === CROSS_PLATFORM
      ? "Mobile app"
      : activeConv?.userName ?? "Someone";
  const callPartnerAvatar =
    selectedConversation === CROSS_PLATFORM ? undefined : activeConv?.userPhoto;

  return (
    <div className={`chat-page ${showMobileConversationList ? "mobile-showing-list" : "mobile-showing-thread"}`}>
      <div className="chat-sidebar">
        <div className="chat-brand">
          <span className="chat-brand-mark" aria-hidden="true">✦</span>
          <div>
            <strong>Hi!</strong>
            <span>Good chemistry starts here</span>
          </div>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search your chats…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="conversations-list">
          {/* Cross-platform chat with mobile app */}
          <div
            className={`conversation-item conversation-item-cross ${
              selectedConversation === CROSS_PLATFORM ? "active" : ""
            }`}
            onClick={() => selectConversation(CROSS_PLATFORM)}
          >
            <div className="conv-avatar">
              <div className="mobile-icon">📱</div>
              <div className={`status-indicator ${mobileAppOnline ? "online" : ""}`} />
            </div>

            <div className="conv-content">
              <div className="conv-header">
                <h4>Shared test room</h4>
                <span className="time">{mobileAppOnline ? "● People online" : "Waiting for friends"}</span>
              </div>
              <p className="last-message">
                Everyone connected can see messages here
              </p>
            </div>
          </div>

          {loading ? (
            <p className="empty">Loading your chats…</p>
          ) : filteredConversations.length === 0 ? (
            <p className="empty">
              No chats yet — like someone in Discover and they'll show up here once you match.
            </p>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${
                  selectedConversation === conv.userId ? "active" : ""
                }`}
                onClick={() => selectConversation(conv.userId)}
              >
                <div className="conv-avatar">
                  <img src={conv.userPhoto} alt={conv.userName} />
                  <div className={`status-indicator ${conv.online ? "online" : ""}`} />
                </div>

                <div className="conv-content">
                  <div className="conv-header">
                    <h4>{conv.userName}</h4>
                    <span className="time">{new Date(conv.lastMessageTime).toLocaleTimeString()}</span>
                  </div>
                  <p className="last-message">
                    {conv.lastMessage.substring(0, 50)}...
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <div className="unread-badge">{conv.unreadCount}</div>
                )}
              </div>
            ))
          )}
        </div>
        {onLogout && (
          <div className="chat-sidebar-footer">
            <button type="button" onClick={onLogout}>Log out</button>
          </div>
        )}
      </div>

      <div className="chat-main">
        {selectedConversation && (
          <>
            <div className="chat-header">
              <button
                type="button"
                className="chat-mobile-back"
                onClick={() => setShowMobileConversationList(true)}
                aria-label="Back to conversations"
              >
                ←
              </button>
              <h2>
                {selectedConversation === CROSS_PLATFORM
                  ? "Shared test chat"
                  : conversations.find((c) => c.userId === selectedConversation)?.userName}
              </h2>
              <div className="chat-header-actions">
                <button
                  type="button"
                  className="chat-call-btn"
                  onClick={() => setCallType("voice")}
                  title="Voice call"
                  aria-label="Start voice call"
                >
                  <PhoneIcon size={18} />
                </button>
                <button
                  type="button"
                  className="chat-call-btn video"
                  onClick={() => setCallType("video")}
                  title="Video call"
                  aria-label="Start video call"
                >
                  <VideoIcon size={18} />
                </button>
              </div>
              <span className="chat-header-status">
                {selectedConversation === CROSS_PLATFORM
                  ? mobileAppOnline
                    ? "● Friends are connected · visible to everyone in this room"
                    : "Waiting for a friend · messages are visible to everyone here"
                  : conversations.find((c) => c.userId === selectedConversation)?.online
                    ? "● Online now"
                    : "Offline"}
              </span>
            </div>

            <div className="messages-container">
              {messages.map((msg) => {
                const isMine = msg.from === currentUserId || msg.from === "me";
                return (
                  <div
                    key={msg.id}
                    className={`message ${isMine ? "sent" : "received"}`}
                  >
                    <div className="message-content">
                      {msg.type === "voice-note" && msg.audioUrl ? (
                        <div className="voice-note">
                          <span className="voice-note-label">Voice note</span>
                          <audio controls src={msg.audioUrl} />
                        </div>
                      ) : msg.type === "file" && msg.attachment ? (
                        <a
                          className="chat-file-attachment"
                          href={msg.attachment.dataUrl}
                          download={msg.attachment.name}
                        >
                          <span className="chat-file-icon" aria-hidden="true">↧</span>
                          <span className="chat-file-details">
                            <strong>{msg.attachment.name}</strong>
                            <small>
                              {msg.attachment.mimeType} · {(msg.attachment.size / 1024).toFixed(0)} KB
                            </small>
                          </span>
                        </a>
                      ) : (
                        <p>{msg.body}</p>
                      )}
                      <span className="timestamp">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isPremium && !TESTING_ACCESS && (
              <div className="chat-plan-banner">
                {canSendMessage ? (
                  <span>
                    Free plan: <strong>{messagesLeftToday}</strong> of {FREE_DAILY_MESSAGE_LIMIT}{" "}
                    daily messages left.{" "}
                    <button
                      type="button"
                      className="chat-plan-link"
                      onClick={() => onNavigate?.("subscribe")}
                    >
                      Upgrade to Premium →
                    </button>
                  </span>
                ) : (
                  <span>
                    You've used all {FREE_DAILY_MESSAGE_LIMIT} free messages today.{" "}
                    <button
                      type="button"
                      className="chat-plan-link"
                      onClick={() => onNavigate?.("subscribe")}
                    >
                      Upgrade for unlimited →
                    </button>
                  </span>
                )}
              </div>
            )}

            <div className="message-input-container">
              <input
                ref={fileInputRef}
                className="chat-file-input"
                type="file"
                accept="*/*"
                onChange={(event) => handleSelectFile(event.target.files?.[0])}
                aria-label="Choose a file attachment"
              />
              <button
                type="button"
                className="chat-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canSendMessage || sendingAttachment}
                title="Attach any file type (up to 512 KB)"
                aria-label="Attach a file"
              >
                +
              </button>
              <button
                type="button"
                className={`voice-note-btn ${isRecording ? "recording" : ""}`}
                onClick={isRecording ? handleStopVoiceNote : handleStartVoiceNote}
                disabled={!canSendMessage || !selectedConversation}
                title={isRecording ? "Stop and send voice note" : "Record voice note"}
                aria-label={isRecording ? "Stop and send voice note" : "Record voice note"}
              >
                {isRecording ? "■" : "🎙"}
              </button>
              <input
                type="text"
                placeholder={selectedFile
                  ? `Ready to share ${selectedFile.name}`
                  : (
                  canSendMessage
                    ? "Say something nice…"
                    : "Daily limit reached — upgrade to send more"
                  )}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!canSendMessage || Boolean(selectedFile)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
              />
              <button
                onClick={selectedFile ? handleSendFile : handleSendMessage}
                disabled={!canSendMessage || sendingAttachment}
              >
                {sendingAttachment ? "Sending…" : selectedFile ? "Share file" : "Send"}
              </button>
            </div>
            {selectedFile && (
              <div className="chat-attachment-note">
                Any file type · up to 512 KB
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setAttachmentError(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Remove
                </button>
              </div>
            )}
            {attachmentError && <div className="voice-note-error" role="alert">{attachmentError}</div>}
            {voiceError && <div className="voice-note-error">{voiceError}</div>}
          </>
        )}
      </div>

      {callType && (
        <CallOverlay
          type={callType}
          name={callPartnerName}
          avatarUrl={callPartnerAvatar}
          onEnd={() => setCallType(null)}
        />
      )}
    </div>
  );
}
