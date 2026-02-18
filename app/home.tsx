import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

async function postText(url: string, body: any) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
    return text;
}

export default function Home() {
    const [apiBase, setApiBase] = useState("");
    const [token, setToken] = useState("");
    const [cmd, setCmd] = useState("PING");
    const [out, setOut] = useState("");

    useEffect(() => {
        (async () => {
            const a = await AsyncStorage.getItem("moltbot_api");
            const t = await AsyncStorage.getItem("moltbot_token");
            if (!a || !t) return router.replace("/login");
            setApiBase(a);
            setToken(t);
        })();
    }, []);

    async function whoami() {
        try {
            // ajusta si tu server usa otro endpoint:
            const text = await postText(`${apiBase}/login`, { user: "admin", pass: token });
            setOut(text);
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Error");
        }
    }

    async function sendCmd() {
        try {
            const text = await postText(`${apiBase}/cmd`, { token, message: cmd });
            setOut(text);
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Error");
        }
    }

    async function logout() {
        await AsyncStorage.removeItem("moltbot_api");
        await AsyncStorage.removeItem("moltbot_token");
        router.replace("/login");
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Panel</Text>
            <Text style={styles.small}>API: {apiBase}</Text>

            <View style={styles.row}>
                <Pressable style={styles.btn} onPress={whoami}>
                    <Text style={styles.btnText}>Whoami</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.red]} onPress={logout}>
                    <Text style={styles.btnText}>Salir</Text>
                </Pressable>
            </View>

            <Text style={styles.label}>Comando</Text>
            <TextInput style={styles.input} value={cmd} onChangeText={setCmd} autoCapitalize="none" />

            <Pressable style={styles.btn} onPress={sendCmd}>
                <Text style={styles.btnText}>Enviar CMD</Text>
            </Pressable>

            <Text style={styles.label}>Salida</Text>
            <ScrollView style={styles.outBox}>
                <Text selectable style={styles.outText}>{out || "(vacío)"}</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, gap: 10, paddingTop: 40 },
    title: { fontSize: 24, fontWeight: "700" },
    small: { fontSize: 12, opacity: 0.7 },
    row: { flexDirection: "row", gap: 10 },
    label: { fontSize: 14, opacity: 0.8, marginTop: 8 },
    input: { borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12 },
    btn: { backgroundColor: "black", padding: 14, borderRadius: 12, flex: 1 },
    red: { backgroundColor: "#b00020" },
    btnText: { color: "white", textAlign: "center", fontWeight: "700" },
    outBox: { borderWidth: 1, borderColor: "#999", borderRadius: 10, padding: 12, height: 220 },
    outText: { fontFamily: "monospace" },
});
