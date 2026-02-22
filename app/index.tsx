import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

async function verifyToken(apiBase: string, token: string) {
  const res = await fetch(`${apiBase}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  return res.ok;
}

export default function Index() {
  useEffect(() => {
    (async () => {
      const apiBase = (await AsyncStorage.getItem("moltbot_api"))?.trim();
      const token = (await AsyncStorage.getItem("moltbot_token"))?.trim();

      if (!apiBase || !token) {
        router.replace("/login");
        return;
      }

      try {
        const ok = await verifyToken(apiBase, token);

        if (ok) {
          router.replace("/home");
        } else {
          await AsyncStorage.removeItem("moltbot_token");
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}