import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
    const { signIn } = useAuth();

    const [apiBase, setApiBase] = useState("http://127.0.0.1:8080");
    const [token, setToken] = useState("");

    async function onSave() {
        const base = apiBase.trim().replace(/\/+$/, ""); // quita slash final
        const tok = token.trim();

        if (!base || !tok) {
            Alert.alert("Falta info", "API Base y Token son obligatorios.");
            return;
        }

        try {
            const res = await fetch(`${base}/auth/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: tok }),
            });

            const text = await res.text();

            let data: any = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                data = text;
            }

            const isOk =
                res.ok &&
                data &&
                typeof data === "object" &&
                (data.ok === true || data.response === "TOKEN_OK");

            if (!isOk) {
                const msg =
                    (data && typeof data === "object" && (data.response || data.error || data.message)) ||
                    `Token inválido (HTTP ${res.status})`;
                throw new Error(msg);
            }

            // ✅ Guardar API base en AsyncStorage (config)
            await AsyncStorage.setItem("moltbot_api", base);

            // ✅ Guardar token en AuthContext (SecureStore) -> Home lo lee desde useAuth()
            await signIn(tok);

            router.replace("/home");
        } catch (e: any) {
            Alert.alert("No autorizado", e?.message ?? "Token inválido");
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Moltbot</Text>

            <Text style={styles.label}>API Base</Text>
            <TextInput
                style={styles.input}
                value={apiBase}
                onChangeText={setApiBase}
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Text style={styles.label}>Token</Text>
            <TextInput
                style={styles.input}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
            />

            <Pressable style={styles.btn} onPress={onSave}>
                <Text style={styles.btnText}>Guardar</Text>
            </Pressable>

            <Text style={styles.hint}>
                En Web puedes usar 127.0.0.1. En celular luego usaremos IP/Tailscale.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: "center", gap: 10 },
    title: { fontSize: 28, fontWeight: "700" },
    label: { fontSize: 14, opacity: 0.8 },
    input: { borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 },
    btn: { backgroundColor: "black", padding: 14, borderRadius: 12, marginTop: 8 },
    btnText: { color: "white", textAlign: "center", fontWeight: "700" },
    hint: { marginTop: 10, fontSize: 12, opacity: 0.7 },
});