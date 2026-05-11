import { Pressable, StyleSheet, Text, View } from "react-native";

export type TabId =
  | "home"
  | "status"
  | "calls"
  | "settings"
  | "web"
  | "smart-discovery"
  | "verified-profiles"
  | "better-matches";

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const tabs: { id: TabId; icon: string; label: string }[] = [
  { id: "home", icon: "💬", label: "Chats" },
  { id: "status", icon: "◉", label: "Status" },
  { id: "calls", icon: "📞", label: "Calls" },
  { id: "settings", icon: "👤", label: "Profile" },
  { id: "web", icon: "🌐", label: "Web" },
];

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <View style={styles.bar}>
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>{t.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#ececf2",
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "#e8f5f1",
  },
  icon: {
    fontSize: 20,
    color: "#6b7280",
    marginBottom: 2,
  },
  iconActive: {
    color: "#075e54",
  },
  label: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  labelActive: {
    color: "#075e54",
    fontWeight: "700",
  },
});
