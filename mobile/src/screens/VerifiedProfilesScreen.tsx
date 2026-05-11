import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { TabId } from "../components/TabBar";

interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  location: string;
  interests: string[];
  verified: boolean;
  online: boolean;
}

interface Props {
  token: string;
  backendUrl: string;
  onNavigate: (tab: TabId) => void;
}

export function VerifiedProfilesScreen({ token, backendUrl, onNavigate }: Props) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/api/discover`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setUsers(await res.json());
      } catch (e) {
        console.warn("verified-profiles fetch", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, backendUrl]);

  const handleLike = async (id: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUserId: id }),
      });
      if (res.ok) setLikedIds((p) => [...p, id]);
    } catch (e) {
      console.warn(e);
    }
  };

  const verified = users.filter((u) => u.verified);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>🛡️ Verified Profiles</Text>
        <Text style={styles.title}>Match only with verified, real people</Text>
        <Text style={styles.subtitle}>
          Identity-checked, photo-validated profiles only — no bots, no fakes.
        </Text>
      </View>

      <View style={styles.statBar}>
        <Text style={styles.statText}>
          <Text style={styles.statStrong}>{verified.length}</Text> verified profile
          {verified.length === 1 ? "" : "s"}
        </Text>
      </View>

      {loading ? (
        <Text style={styles.empty}>Loading verified profiles…</Text>
      ) : verified.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>No verified profiles right now.</Text>
        </View>
      ) : (
        verified.map((u) => (
          <View key={u.id} style={styles.profileCard}>
            <View style={styles.photoWrap}>
              {u.photos?.[0] && <Image source={{ uri: u.photos[0] }} style={styles.profilePhoto} />}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✓ Verified</Text>
              </View>
              {u.online && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.profileBody}>
              <Text style={styles.profileName}>
                {u.name}, {u.age}
              </Text>
              <Text style={styles.profileLoc}>{u.location}</Text>
              {u.bio ? <Text style={styles.profileBio}>{u.bio}</Text> : null}
              <View style={styles.profileActions}>
                <Pressable
                  style={[styles.likeBtn, likedIds.includes(u.id) && styles.likeBtnDone]}
                  onPress={() => handleLike(u.id)}
                  disabled={likedIds.includes(u.id)}
                >
                  <Text style={styles.likeBtnText}>
                    {likedIds.includes(u.id) ? "♥ Liked" : "♥ Like"}
                  </Text>
                </Pressable>
                <Pressable style={styles.msgBtn} onPress={() => onNavigate("home")}>
                  <Text style={styles.msgBtnText}>💬 Message</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}

      <View style={styles.crossLinks}>
        <Pressable style={styles.crossBtn} onPress={() => onNavigate("smart-discovery")}>
          <Text style={styles.crossBtnText}>🔍 Smart Discovery →</Text>
        </Pressable>
        <Pressable style={styles.crossBtn} onPress={() => onNavigate("better-matches")}>
          <Text style={styles.crossBtnText}>💞 Better Matches →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafbfc" },
  content: { padding: 16, gap: 12 },
  hero: { paddingVertical: 12 },
  eyebrow: { fontSize: 12, fontWeight: "700", color: "#2bb673", marginBottom: 6 },
  title: { fontSize: 22, fontWeight: "700", color: "#14142b", letterSpacing: -0.4, marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6b7280", lineHeight: 18 },
  statBar: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ececf2",
    padding: 12,
  },
  statText: { fontSize: 14, color: "#14142b" },
  statStrong: { fontWeight: "700", color: "#2bb673" },
  empty: { color: "#6b7280", fontSize: 14, textAlign: "center", padding: 16 },
  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececf2",
    padding: 16,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececf2",
    overflow: "hidden",
  },
  photoWrap: { position: "relative" },
  profilePhoto: { width: "100%", height: 240 },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#2bb673",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  onlineDot: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2bb673",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileBody: { padding: 14, gap: 6 },
  profileName: { fontSize: 17, fontWeight: "700", color: "#14142b" },
  profileLoc: { color: "#6b7280", fontSize: 13 },
  profileBio: { color: "#14142b", fontSize: 14, lineHeight: 20, marginTop: 4 },
  profileActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  likeBtn: {
    flex: 1,
    backgroundColor: "#ff5a6e",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  likeBtnDone: { backgroundColor: "#9ca3af" },
  likeBtnText: { color: "#fff", fontWeight: "700" },
  msgBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#ff5a6e",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  msgBtnText: { color: "#ff5a6e", fontWeight: "700" },
  crossLinks: { gap: 8, marginTop: 12 },
  crossBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ececf2",
    borderRadius: 12,
    padding: 14,
  },
  crossBtnText: { fontSize: 14, fontWeight: "600", color: "#14142b" },
});
