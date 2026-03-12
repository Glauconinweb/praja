import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Mensagem = {
  id: string;
  texto: string;
  autorId: string;
  createdAt: string;
};

type Usuario = {
  id: string;
  nome: string;
  email: string;
};



const API_URL = "http://localhost:5001/api"; // Altere para seu IP se testar em dispositivo físico

export default function ChatScreen() {
  const { chatId, pedidoId, nomeOutro } = useLocalSearchParams();
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novoTexto, setNovoTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const flatListRef = useRef<FlatList<Mensagem>>(null);


  useEffect(() => {
    carregarUsuario();
  }, []);

  useEffect(() => {
    if (usuario && chatId) {
      carregarMensagens();
      const interval = setInterval(carregarMensagens, 3000); // Polling a cada 3s
      return () => clearInterval(interval);
    }
  }, [usuario, chatId]);

  async function carregarUsuario() {
    const userJson = await AsyncStorage.getItem("user");
    if (userJson) setUsuario(JSON.parse(userJson));
  }

  async function carregarMensagens() {
    try {
      const response = await fetch(`${API_URL}/chat/${chatId}/mensagens`);
      const data = await response.json();
      setMensagens(data);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoading(false);
    }
  }

  async function enviarMensagem() {
    if (!novoTexto.trim() || !usuario) return;

    const textoParaEnviar = novoTexto;
    setNovoTexto("");

    try {
      const response = await fetch(`${API_URL}/chat/${chatId}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autorId: usuario.id,
          texto: textoParaEnviar,
        }),
      });

      if (response.ok) {
        carregarMensagens();
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    }
  }

  const renderMensagem = ({ item }: { item: Mensagem }) => {
    const eMinha = item.autorId === usuario?.id;
    return (
      <View
        style={[
          styles.msgContainer,
          eMinha ? styles.minhaMsg : styles.outraMsg,
        ]}
      >
        <Text style={[styles.msgTexto, eMinha ? styles.minhaMsgTexto : null]}>
          {item.texto}
        </Text>
        <Text style={styles.msgHora}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerNome}>{nomeOutro || "Chat"}</Text>
          <Text style={styles.headerStatus}>Pedido #{pedidoId?.slice(-5)}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ee3f0aff" style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={(item: Mensagem) => item.id}
          renderItem={renderMensagem}
          contentContainerStyle={styles.listaMensagens}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
      )}

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem..."
          value={novoTexto}
          onChangeText={setNovoTexto}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={enviarMensagem}>
          <Feather name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#ee3f0aff",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: { marginLeft: 15 },
  headerNome: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerStatus: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  listaMensagens: { padding: 20 },
  msgContainer: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  minhaMsg: {
    alignSelf: "flex-end",
    backgroundColor: "#ee3f0aff",
    borderBottomRightRadius: 2,
  },
  outraMsg: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 2,
    elevation: 1,
  },
  msgTexto: { fontSize: 15, color: "#333" },
  minhaMsgTexto: { color: "#fff" },
  msgHora: {
    fontSize: 10,
    color: "#999",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputArea: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: "#ee3f0aff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
