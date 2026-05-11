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

function compatibilityScore(u: Profile): number {
  let score = 50;
  if (u.verified) score += 15;
  if (u.online) score += 5;
  if (u.bio) score += Math.min(10, u.bio.length / 20);
  if (u.interests?.length) score += Math.min(15, u.interests.length * 2);
  return Math.min(99, Math.round(score));
}

const matchFactors = [
  { icon: "🛡️", title: "Verified identity", weight: "+15 pts" },
  { icon: "🎯", title: "Shared interests", weight: "up to +15 pts" },
  { icon: "📝", title: "Profile depth", weight: "up to +10 pts" },
  { icon: "🟢", title: "Active right now", weight: "+5 pts" },
];

export function BetterMatchesScreen({ token, backendUrl, onNavigate }: Props) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "online">("score");
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
        console.warn("better-matches fetch", e);
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

  const sorted = [...users].sort((a, b) => {
    if (sortBy === "online") {
      const d = Number(b.online) - Number(a.online);
      if (d !== 0) return d;
    }
    return compatibilityScore(b) - compatibilityScore(a);
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>💞 Better Matches</Text>
        <Text style={styles.title}>New people, ranked by compatibility</Text>
        <Text style={styles.subtitle}>
          Fresh profiles sorted by shared interests, verification, and engagement.
        </Text>
      </View>

      <View style={styles.factorCard}>
        <Text style={styles.factorTitle}>What makes people match</Text>
        {matchFactors.map((f) => (
          <View key={f.title} style={styles.factorRow}>
            <Text style={styles.factorIcon}>{f.icon}</Text>
            <Text style={styles.factorName}>{f.title}</Text>
            <Text style={styles.factorWeight}>{f.weight}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sortRow}>
        <Pressable
          style={[styles.sortPill, sortBy === "score" && styles.sortPillActive]}
          onPress={() => setSortBy("score")}
        >
          <Text style={[styles.sortText, sortBy === "score" && styles.sortTextActive]}>
            By compatibility
          </Text>
        </Pressable>
        <Pressable
          style={[styles.sortPill, sortBy === "online" && styles.sortPillActive]}
          onPress={() => setSortBy("online")}
        >
          <Text style={[styles.sortText, sortBy === "online" && styles.sortTextActive]}>
            Online first
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <Text style={styles.empty}>Loading new people…</Text>
      ) : sorted.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>No new people yet. Check Smart Discovery.</Text>
        </View>
      ) : (
        sorted.map((u) => {
          const score = compatibilityScore(u);
          return (
            <View key={u.id} style={styles.matchCard}>
              <View style={styles.photoWrap}>
                {u.photos?.[0] && <Image source={{ uri: u.photos[0] }} style={styles.photo} />}
                {u.verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓</Text>
                  </View>
                )}
                {u.online && (
                  <View style={styles.onlinePill}>
                    <Text style={styles.onlinePillText}>● Online</Text>
                  </View>
                )}
              </View>
              <View style={styles.matchBody}>
                <Text style={styles.matchName}>
                  {u.name}, {u.age}
                </Text>
                <Text style={styles.matchLoc}>{u.location}</Text>
                {u.bio ? (
                  <Text style={styles.matchBio} numberOfLines={2}>
                    {u.bio}
                  </Text>
                ) : null}
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${score}%` }]} />
                  <Text style={styles.barLabel}>{score}% match</Text>
                </View>
                <View style={styles.matchActions}>
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
          );
        })
      )}

      <View style={styles.crossLinks}>
        <Pressable style={styles.crossBtn} onPress={() => onNavigate("smart-discovery")}>
          <Text style={styles.crossBtnText}>🔍 Smart Discovery →</Text>
        </Pressable>
        <Pressable style={styles.crossBtn} onPress={() => onNavigate("verified-profiles")}>
          <Text style={styles.crossBtnText}>🛡️ Verified Profiles →</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafbfc" },
  content: { padding: 16, gap: 12 },
  hero: { paddingVertical: 12 },
  eyebrow: { fontSize: 12, fontWeight: "700", color: "#ff5a6e", marginBottom: 6 },
  title: { fontSize: 22, fontWeight: "700", color: "#14142b", letterSpacing: -0.4, marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6b7280", lineHeight: 18 },
  factorCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececf2",
    padding: 14,
  },
  factorTitle: { fontSize: 13, fontWeight: "700", color: "#14142b", marginBottom: 10 },
  factorRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  factorIcon: { fontSize: 16 },
  factorName: { flex: 1, color: "#14142b", fontSize: 13, fontWeight: "500" },
  factorWeight: {
    fontSize: 11,
    color: "#ff5a6e",
    backgroundColor: "#fff5f7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "700",
  },
  sortRow: { flexDirection: "row", gap: 6 },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ececf2",
    backgroundColor: "#fff",
  },
  sortPillActive: { backgroundColor: "#ff5a6e", borderColor: "#ff5a6e" },
  sortText: { color: "#14142b", fontSize: 13, fontWeight: "600" },
  sortTextActive: { color: "#fff" },
  empty: { color: "#6b7280", fontSize: 14, textAlign: "center", padding: 16 },
  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececf2",
    padding: 16,
  },
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececf2",
    overflow: "hidden",
  },
  photoWrap: { position: "relative" },
  photo: { width: "100%", height: 200 },
  verifiedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#2bb673",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  onlinePill: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#2bb673",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  onlinePillText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  matchBody: { padding: 14, gap: 6 },
  matchName: { fontSize: 17, fontWeight: "700", color: "#14142b" },
  matchLoc: { color: "#6b7280", fontSize: 13 },
  matchBio: { color: "#14142b", fontSize: 13, lineHeight: 18 },
  bar: {
    position: "relative",
    height: 14,
    backgroundColor: "#fff5f7",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  barFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#ff5a6e",
  },
  barLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    zIndex: 1,
  },
  matchActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  likeBtn: {
    flex: 1,
    backgroundColor: "#ff5a6e",
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  likeBtnDone: { backgroundColor: "#9ca3af" },
  likeBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  msgBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#ff5a6e",
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  msgBtnText: { color: "#ff5a6e", fontWeight: "700", fontSize: 13 },
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
