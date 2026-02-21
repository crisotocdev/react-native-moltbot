import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type CmdResponse = {
    ok: boolean;
    role: string;
    command: string;
    argument: string;
    response: string;
};

function joinUrl(base: string, path: string) {
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${b}${p}`;
}

async function postJson<T>(url: string, body: any): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const text = await res.text();

    let data: any = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        const msg =
            (data && typeof data === "object" && (data.response || data.error || data.message)) ||
            (typeof data === "string" ? data : "") ||
            `HTTP ${res.status}`;
        throw new Error(msg);
    }

    return data as T;
}

export default function Home() {
    const [apiBase, setApiBase] = useState("");
    const [token, setToken] = useState("");
    const [cmd, setCmd] = useState("PING");
    const [out, setOut] = useState("");

    const base = useMemo(() => apiBase.trim(), [apiBase]);
    const tok = useMemo(() => token.trim(), [token]);

    useEffect(() => {
        (async () => {
            const a = await AsyncStorage.getItem("moltbot_api");
            const t = await AsyncStorage.getItem("moltbot_token");
            if (!a || !t) return router.replace("/login");
            setApiBase(a);
            setToken(t);
        })();
    }, []);

    function renderCmdResult(data: CmdResponse) {
        // salida “humana” + JSON para debug
        const human = `${data.ok ? "✅" : "❌"} ${data.role} | ${data.command}${data.argument ? " " + data.argument : ""
            }\n${data.response}`;

        const debug = `\n\n---\nJSON:\n${JSON.stringify(data, null, 2)}`;
        return human + debug;
    }

    async function runCommand(message: string) {
        if (!base || !tok) {
            router.replace("/login");
            return;
        }

        const url = joinUrl(base, "/cmd");

        // ✅ tu backend espera { token, message }
        const data = await postJson<CmdResponse>(url, { token: tok, message });

        setOut(renderCmdResult(data));
    }

    async function whoami() {
        try {
            await runCommand("WHOAMI");
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Error");
        }
    }

    async function sendCmd() {
        try {
            const message = cmd.trim();
            if (!message) {
                Alert.alert("Falta comando", "Escribe un comando (ej: PING).");
                return;
            }
            await runCommand(message);
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
            <Text style={styles.small}>API: {base || "(no configurada)"}</Text>

            <View style={styles.row}>
                <Pressable style={styles.btn} onPress={whoami}>
                    <Text style={styles.btnText}>Whoami</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.red]} onPress={logout}>
                    <Text style={styles.btnText}>Salir</Text>
                </Pressable>
            </View>

            <Text style={styles.label}>Comando</Text>
            <TextInput
                style={styles.input}
                value={cmd}
                onChangeText={setCmd}
                autoCapitalize="none"
                placeholder="PING, TIME, SYSINFO, PROCESOS, WHOAMI..."
            />

            <Pressable style={styles.btn} onPress={sendCmd}>
                <Text style={styles.btnText}>Enviar CMD</Text>
            </Pressable>

            <Text style={styles.label}>Salida</Text>
            <ScrollView style={styles.outBox}>
                <Text selectable style={styles.outText}>
                    {out || "(vacío)"}
                </Text>
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