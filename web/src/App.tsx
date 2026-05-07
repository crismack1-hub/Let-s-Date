import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = "http://localhost:4000";

type Message = {
  id: string;
  from: string;
  to: string;
  body: string;
  roomId: string;
  createdAt: string;
  type: string;
};

type Presence = {
  userId: string;
  online: boolean;
  lastSeen: string;
};

function App() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [presence, setPresence] = useState<Record<string, Presence>>({});

  const socketClient = useMemo(() => {
    if (!token) return null;
    return io(BACKEND_URL, { auth: { token } });
  }, [token]);

  useEffect(() => {
    if (!socketClient) return;

    setSocket(socketClient);

    socketClient.on("connect", () => {
      console.log("Connected to realtime backend", socketClient.id);
      socketClient.emit("join-room", "global-room");
    });

    socketClient.on("message", (message: Message) => {
      setMessages((current) => [...current, message]);
    });

    socketClient.on("presence", (payload: Presence) => {
      setPresence((current) => ({ ...current, [payload.userId]: payload }));
    });

    return () => {
      socketClient.disconnect();
    };
  }, [socketClient]);

  async function handleLogin() {
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
  }

  async function handleSend() {
    if (!socket || !currentMessage) return;
    socket.emit("direct-message", {
      to: "global",
      body: currentMessage,
      roomId: "global-room",
      encryptedPayload: currentMessage,
    });
    setCurrentMessage("");
  }

  if (!token) {
    return (
      <div className="container">
        <h1>Messaging App</h1>
        <div className="form">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
          <button onClick={handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Chat</h1>
      </header>
      <section className="chat">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <div className="message-meta">
              <strong>{message.from}</strong> <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
            </div>
            <div>{message.body}</div>
          </div>
        ))}
      </section>
      <footer className="composer">
        <input value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder="Type a message" />
        <button onClick={handleSend}>Send</button>
      </footer>
    </div>
  );
}

export default App;
