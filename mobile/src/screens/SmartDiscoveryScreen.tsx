import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
  lookingFor: string;
}

interface Props {
  token: string;
  backendUrl: string;
  onNavigate: (tab: TabId) => void;
}

const interestChips = ["Hiking", "Coffee", "Travel", "Music", "Movies", "Books", "Foodie", "Fitness", "Art", "Pets"];

export function SmartDiscoveryScreen({ token, backendUrl, onNavigate }: Props) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("60");
  const [location, setLocation] = useState("");
  const [lookingFor, setLookingFor] = useState<"any" | "Long-term" | "Open to anything">("any");
  const [interests, setInterests] = useState<string[]>([]);
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
        console.warn("smart-discovery fetch", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, backendUrl]);

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

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

  const ageMinNum = parseInt(ageMin, 10) || 18;
  const ageMaxNum = parseInt(ageMax, 10) || 60;

  const filtered = users.filter((u) => {
    if (u.age < ageMinNum || u.age > ageMaxNum) return false;
    if (location && !u.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (lookingFor !== "any" && u.lookingFor !== lookingFor) return false;
    if (interests.length && !u.interests?.some((ui) => interests.includes(ui))) return false;
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>🔍 Smart Discovery</Text>
        <Text style={styles.title}>Find your most compatible matches</Text>
        <Text style={styles.subtitle}>
          Filter by age, location, interests, and shared values.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Filters</Text>

        <Text style={styles.label}>Age</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={ageMin}
            onChangeText={setAgeMin}
            keyboardType="numeric"
          />
          <Text style={styles.dash}>to</Text>
          <TextInput
            style={[styles.input, styles.inputSmall]}
            value={ageMax}
            onChangeText={setAgeMax}
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="City or area"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Looking for</Text>
        <View style={styles.row}>
          {(["any", "Long-term", "Open to anything"] as const).map((v) => (
            <Pressable
              key={v}
              style={[styles.pill, lookingFor === v && styles.pillActive]}
              onPress={() => setLookingFor(v)}
            >
              <Text style={[styles.pillText, lookingFor === v && styles.pillTextActive]}>
                {v === "any" ? "Any" : v}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Interests</Text>
        <View style={styles.chipRow}>
          {interestChips.map((c) => (
            <Pressable
              key={c}
              style={[styles.chip, interests.includes(c) && styles.chipActive]}
              onPress={() => toggleInterest(c)}
            >
              <Text style={[styles.chipText, interests.includes(c) && styles.chipTextActive]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          <Text style={styles.resultsCountStrong}>{filtered.length}</Text> profile
          {filtered.length === 1 ? "" : "s"} match
        </Text>
        {filtered.length !== users.length && (
          <Text style={styles.resultsMeta}>(of {users.length})</Text>
        )}
      </View>

      {loading ? (
        <Text style={styles.empty}>Loading profiles…</Text>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.empty}>No profiles match. Try widening your filters.</Text>
        </View>
      ) : (
        filtered.map((u) => (
          <View key={u.id} style={styles.profileCard}>
            {u.photos?.[0] && <Image source={{ uri: u.photos[0] }} style={styles.profilePhoto} />}
            <View style={styles.profileBody}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>
                  {u.name}, {u.age}
                </Text>
                {u.verified && <Text style={styles.verifiedBadge}>✓ Verified</Text>}
              </View>
              <Text style={styles.profileLoc}>{u.location}</Text>
              {u.bio ? <Text style={styles.profileBio}>{u.bio}</Text> : null}
              <View style={styles.profileChips}>
                {u.interests?.slice(0, 4).map((i) => (
                  <Text key={i} style={styles.profileChip}>
                    {i}
                  </Text>
                ))}
              </View>
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
        <Pressable style={styles.crossBtn} onPress={() => onNavigate("verified-profiles")}>
          <Text style={styles.crossBtnText}>🛡️ Verified Profiles →</Text>
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
  content: { padding: 16, gap: 14 },
  hero: { paddingVertical: 12 },
  eyebrow: { fontSize: 12, fontWeight: "700", color: "#ff5a6e", marginBottom: 6 },
  title: { fontSize: 22, fontWeight: "700", color: "#14142b", letterSpacing: -0.4, marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6b7280", lineHeight: 18 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ececf2",
    padding: 14,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#14142b", marginBottom: 10 },
  label: { fontSize: 12, fontWeight: "600", color: "#14142b", marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ececf2",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fafbfc",
    color: "#14142b",
    fontSize: 14,
  },
  inputSmall: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  dash: { color: "#6b7280" },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ececf2",
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: "#ff5a6e", borderColor: "#ff5a6e" },
  pillText: { fontSize: 13, color: "#14142b", fontWeight: "600" },
  pillTextActive: { color: "#fff" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ff5a6e",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#ff5a6e" },
  chipText: { color: "#ff5a6e", fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  resultsHeader: { flexDirection: "row", alignItems: "baseline", gap: 8, paddingHorizontal: 4 },
  resultsCount: { fontSize: 14, fontWeight: "600", color: "#14142b" },
  resultsCountStrong: { color: "#ff5a6e" },
  resultsMeta: { fontSize: 12, color: "#9ca3af" },
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
  profilePhoto: { width: "100%", height: 220 },
  profileBody: { padding: 14, gap: 6 },
  profileNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileName: { fontSize: 17, fontWeight: "700", color: "#14142b" },
  verifiedBadge: {
    backgroundColor: "#2bb673",
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  profileLoc: { color: "#6b7280", fontSize: 13 },
  profileBio: { color: "#14142b", fontSize: 14, lineHeight: 20, marginTop: 4 },
  profileChips: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 },
  profileChip: {
    fontSize: 11,
    color: "#14142b",
    backgroundColor: "#f5f6f8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
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
