import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function Login() {
    const [apiBase, setApiBase] = useState("http://127.0.0.1:8080");
    const [token, setToken] = useState("");

    async function onSave() {
        if (!apiBase.trim() || !token.trim()) {
            Alert.alert("Falta info", "API Base y Token son obligatorios.");
            return;
        }
        await AsyncStorage.setItem("moltbot_api", apiBase.trim());
        await AsyncStorage.setItem("moltbot_token", token.trim());
        router.replace("/home");
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Moltbot</Text>

            <Text style={styles.label}>API Base</Text>
            <TextInput style={styles.input} value={apiBase} onChangeText={setApiBase} autoCapitalize="none" />

            <Text style={styles.label}>Token</Text>
            <TextInput style={styles.input} value={token} onChangeText={setToken} autoCapitalize="none" secureTextEntry />

            <Pressable style={styles.btn} onPress={onSave}>
                <Text style={styles.btnText}>Guardar</Text>
            </Pressable>

            <Text style={styles.hint}>En Web puedes usar 127.0.0.1. En celular luego usaremos IP/Tailscale.</Text>
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
