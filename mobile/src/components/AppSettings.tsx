import { useState } from "react";
import { Button, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, Linking, Switch } from "react-native";

interface AppSettingsProps {
  onLogout: () => void;
  onBackToApp: () => void;
}

type SettingsState = {
  pushNotifications: boolean;
  locationServices: boolean;
  vibration: boolean;
  darkMode: boolean;
};

export function AppSettings({ onLogout, onBackToApp }: AppSettingsProps) {
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState<SettingsState>({
    pushNotifications: true,
    locationServices: false,
    vibration: true,
    darkMode: false,
  });

  const handleToggle = (key: keyof SettingsState) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button title="← Back" onPress={onBackToApp} color="white" />
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
        <Pressable
          onPress={onBackToApp}
          accessibilityLabel="Let's Date — go to home"
          hitSlop={6}
        >
          <Text style={styles.headerLogo}>💕</Text>
        </Pressable>
      </View>

      <View style={styles.tabsContainer}>
        <Button 
          title="👤 Account" 
          onPress={() => setActiveTab("account")}
          color={activeTab === "account" ? "#ff6b6b" : "rgba(255,255,255,0.6)"}
        />
        <Button 
          title="⚙️ Prefs" 
          onPress={() => setActiveTab("preferences")}
          color={activeTab === "preferences" ? "#ff6b6b" : "rgba(255,255,255,0.6)"}
        />
        <Button 
          title="❓ Help" 
          onPress={() => setActiveTab("help")}
          color={activeTab === "help" ? "#ff6b6b" : "rgba(255,255,255,0.6)"}
        />
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "account" && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Profile</Text>
              <Button title="Edit Profile Photo" color="#ff6b6b" />
              <Button title="Change Password" color="#ff6b6b" />
              <Button title="Delete Account" color="#ff6b6b" />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account Options</Text>
              <Text style={styles.cardText}>Visit the website for more options</Text>
              <Button 
                title="Go to Website →" 
                onPress={() => Linking.openURL("https://www.letsdateapp.com")}
                color="#4ecdc4"
              />
            </View>

            <Button title="🚪 Logout" onPress={onLogout} color="#ff5252" />
          </View>
        )}

        {activeTab === "preferences" && (
          <View>
            <View style={styles.settingItem}>
              <Text style={styles.settingTitle}>📳 Push Notifications</Text>
              <Text style={styles.settingDescription}>Get alerts for new matches</Text>
              <Switch
                value={settings.pushNotifications}
                onValueChange={() => handleToggle("pushNotifications")}
                trackColor={{ false: "rgba(255,255,255,0.2)", true: "#ff6b6b" }}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingTitle}>📍 Location Services</Text>
              <Text style={styles.settingDescription}>Allow location access for matches</Text>
              <Switch
                value={settings.locationServices}
                onValueChange={() => handleToggle("locationServices")}
                trackColor={{ false: "rgba(255,255,255,0.2)", true: "#ff6b6b" }}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingTitle}>📳 Vibration</Text>
              <Text style={styles.settingDescription}>Haptic feedback on interactions</Text>
              <Switch
                value={settings.vibration}
                onValueChange={() => handleToggle("vibration")}
                trackColor={{ false: "rgba(255,255,255,0.2)", true: "#ff6b6b" }}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingTitle}>🌙 Dark Mode</Text>
              <Text style={styles.settingDescription}>Easy on the eyes</Text>
              <Switch
                value={settings.darkMode}
                onValueChange={() => handleToggle("darkMode")}
                trackColor={{ false: "rgba(255,255,255,0.2)", true: "#ff6b6b" }}
              />
            </View>
          </View>
        )}

        {activeTab === "help" && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📧 Support</Text>
              <Text style={styles.cardText}>Contact our support team at:</Text>
              <Button 
                title="support@letsdateapp.com" 
                onPress={() => Linking.openURL("mailto:support@letsdateapp.com")}
                color="#4ecdc4"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>📱 Version</Text>
              <Text style={styles.cardText}>Let's Date v1.0.0</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌐 Visit Website</Text>
              <Text style={styles.cardText}>For more features and settings</Text>
              <Button 
                title="Visit Website" 
                onPress={() => Linking.openURL("https://www.letsdateapp.com")}
                color="#4ecdc4"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#667eea",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  headerLogo: {
    fontSize: 22,
    paddingHorizontal: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    gap: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  settingItem: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  settingDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
});
