import { useEffect, useMemo, useState } from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = "http://localhost:4000";

type Message = {
  id: string;
  from: string;
  body: string;
  roomId: string;
  createdAt: string;
};

export default function App() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");

  const socketClient = useMemo(() => {
    if (!token) return null;
    return io(BACKEND_URL, { auth: { token } });
  }, [token]);

  useEffect(() => {
    if (!socketClient) return;
    setSocket(socketClient);

    socketClient.on("connect", () => {
      socketClient.emit("join-room", "mobile-room");
    });

    socketClient.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketClient.disconnect();
    };
  }, [socketClient]);

  const handleLogin = async () => {
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
  };

  const handleSend = () => {
    if (!socket || !currentMessage) return;
    socket.emit("direct-message", {
      to: "mobile",
      body: currentMessage,
      roomId: "mobile-room",
      encryptedPayload: currentMessage,
    });
    setCurrentMessage("");
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Messaging App</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <Button title="Login" onPress={handleLogin} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Mobile Chat</Text>
      <ScrollView style={styles.chat}>
        {messages.map((message) => (
          <View key={message.id} style={styles.messageBubble}>
            <Text style={styles.messageMeta}>{message.from}</Text>
            <Text>{message.body}</Text>
            <Text style={styles.messageTime}>{new Date(message.createdAt).toLocaleTimeString()}</Text>
          </View>
        ))}
      </ScrollView>
      <TextInput style={styles.input} value={currentMessage} onChangeText={setCurrentMessage} placeholder="Type a message" />
      <Button title="Send" onPress={handleSend} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f7fafc",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "white",
  },
  chat: {
    flex: 1,
    marginBottom: 16,
  },
  messageBubble: {
    backgroundColor: "#e2e8f0",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  messageMeta: {
    fontWeight: "700",
    marginBottom: 4,
  },
  messageTime: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
  },
});
