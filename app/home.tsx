import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../auth/AuthContext";

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
    const { token, signOut, loading: authLoading } = useAuth();

    const [apiBase, setApiBase] = useState("");
    const [cmd, setCmd] = useState("PING");
    const [out, setOut] = useState("");
    const [loading, setLoading] = useState(true);

    const base = useMemo(() => apiBase.trim(), [apiBase]);
    const tok = useMemo(() => (token ?? "").trim(), [token]);

    useEffect(() => {
        (async () => {
            // Esperar a que el AuthContext cargue el token desde SecureStore
            if (authLoading) return;

            const a = (await AsyncStorage.getItem("moltbot_api"))?.trim();

            // Si falta apiBase o token -> login
            if (!a || !tok) {
                setLoading(false);
                router.replace("/login");
                return;
            }

            setApiBase(a);

            // Verificar token contra backend (igual que antes, pero sin leerlo de AsyncStorage)
            try {
                const ok = await postJson(joinUrl(a, "/auth/verify"), { token: tok });
                // Si tu /auth/verify devuelve JSON cualquiera en ok, basta con que no tire error.
                void ok;
                setLoading(false);
            } catch (e: any) {
                setLoading(false);
                await signOut(); // limpia token (SecureStore)
                router.replace("/login");
            }
        })();
    }, [authLoading, tok]);

    function renderCmdResult(data: CmdResponse) {
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
        try {
            const data = await postJson<CmdResponse>(url, { token: tok, message });
            setOut(renderCmdResult(data));
        } catch (e: any) {
            const msg = e?.message ?? "Error";

            // Si el backend responde algo tipo "Token inválido", forzamos logout
            if (typeof msg === "string" && msg.toLowerCase().includes("token")) {
                await signOut();
                router.replace("/login");
                return;
            }

            throw e;
        }
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
        // apiBase lo seguimos guardando en AsyncStorage
        await AsyncStorage.removeItem("moltbot_api");
        await signOut(); // token fuera
        setOut("");
        setCmd("PING");
        router.replace("/login");
    }

    if (loading || authLoading) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text>Cargando...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Panel</Text>
            <Text style={styles.small}>API: {base || "(no configurada)"}</Text>

            <View style={styles.row}>
                <Pressable style={[styles.btn, (!tok || !base) && { opacity: 0.5 }]} onPress={whoami} disabled={!tok || !base}>
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
                onSubmitEditing={sendCmd}
                returnKeyType="send"
            />

            <Pressable style={[styles.btn, !cmd.trim() && { opacity: 0.5 }]} onPress={sendCmd} disabled={!cmd.trim()}>
                <Text style={styles.btnText}>Enviar CMD</Text>
            </Pressable>

            <Text style={styles.label}>Salida</Text>
            <Pressable
                style={styles.btn}
                onPress={() => {
                    try {
                        // Web only
                        // @ts-ignore
                        navigator.clipboard.writeText(out);
                        Alert.alert("Listo", "Salida copiada.");
                    } catch {
                        Alert.alert("No disponible", "Copiar funciona solo en web por ahora.");
                    }
                }}
            >
                <Text style={styles.btnText}>Copiar salida</Text>
            </Pressable>

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