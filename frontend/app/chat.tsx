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
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Mensagem = {
  id: string;
  texto: string;
  autorId: string;
  createdAt: string;
  autor?: {
    id: string;
    nome: string;
    foto?: string;
  };
  lida?: boolean;
};

type Usuario = {
  id: string;
  nome: string;
  email: string;
};

type Chat = {
  id: string;
  ativo: boolean;
  pedido?: {
    id: string;
    status: string;
  };
  cliente?: {
    id: string;
    nome: string;
  };
  loja?: {
    id: string;
    nome: string;
  };
};

const API_URL = "http://localhost:5001/api"; // Altere para seu IP se testar em dispositivo físico

export default function ChatScreen() {
  const { chatId, pedidoId, nomeOutro } = useLocalSearchParams();
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novoTexto, setNovoTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [enviando, setEnviando] = useState(false);
  const flatListRef = useRef<FlatList<Mensagem>>(null);

  useEffect(() => {
    carregarUsuarioEToken();
  }, []);

  useEffect(() => {
    if (usuario && token && chatId) {
      carregarChat();
      carregarMensagens();
      const interval = setInterval(carregarMensagens, 3000); // Polling a cada 3s
      return () => clearInterval(interval);
    }
  }, [usuario, token, chatId]);

  async function carregarUsuarioEToken() {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const tokenArmazenado = await AsyncStorage.getItem("token");
      if (userJson) setUsuario(JSON.parse(userJson));
      if (tokenArmazenado) setToken(tokenArmazenado);
    } catch (error) {
      console.error("Erro ao carregar usuário e token:", error);
      Alert.alert("Erro", "Falha ao carregar dados do usuário");
    }
  }

  async function carregarChat() {
    try {
      const response = await fetch(`${API_URL}/chat/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 400) {
          Alert.alert(
            "Chat Encerrado",
            "Este pedido já foi entregue e o chat foi encerrado."
          );
          router.back();
          return;
        }
        throw new Error("Erro ao carregar chat");
      }

      const chatData = await response.json();
      setChat(chatData);
    } catch (error) {
      console.error("Erro ao carregar chat:", error);
    }
  }

  async function carregarMensagens() {
    try {
      const response = await fetch(`${API_URL}/chat/${chatId}/mensagens`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar mensagens");
      }

      const data = await response.json();
      setMensagens(data);

      // Marcar mensagens como lidas
      if (data.length > 0) {
        marcarMensagensComoLidas();
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setLoading(false);
    }
  }

  async function marcarMensagensComoLidas() {
    try {
      await fetch(`${API_URL}/chat/${chatId}/marcar-lidas`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Erro ao marcar mensagens como lidas:", error);
    }
  }

  async function enviarMensagem() {
    if (!novoTexto.trim() || !usuario || !token) return;

    if (!chat?.ativo) {
      Alert.alert("Chat Encerrado", "Este chat foi encerrado.");
      return;
    }

    const textoParaEnviar = novoTexto;
    setNovoTexto("");
    setEnviando(true);

    try {
      const response = await fetch(`${API_URL}/chat/${chatId}/mensagens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          texto: textoParaEnviar,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Erro", errorData.error || "Erro ao enviar mensagem");
        setNovoTexto(textoParaEnviar); // Restaurar texto se falhar
        return;
      }

      // Recarregar mensagens após enviar
      carregarMensagens();
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      Alert.alert("Erro", "Falha ao enviar mensagem");
      setNovoTexto(textoParaEnviar); // Restaurar texto se falhar
    } finally {
      setEnviando(false);
    }
  }

  const renderMensagem = ({ item }: { item: Mensagem }) => {
    const eMinha = item.autorId === usuario?.id;
    const nomePessoa = item.autor?.nome || "Usuário";

    return (
      <View
        style={[
          styles.msgContainer,
          eMinha ? styles.minhaMsg : styles.outraMsg,
        ]}
      >
        {!eMinha && (
          <Text style={styles.nomeAutor}>{nomePessoa}</Text>
        )}
        <Text style={[styles.msgTexto, eMinha ? styles.minhaMsgTexto : null]}>
          {item.texto}
        </Text>
        <View style={styles.rodapeMensagem}>
          <Text style={styles.msgHora}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {eMinha && item.lida && (
            <Feather name="check-circle" size={12} color="#fff" style={{ marginLeft: 4 }} />
          )}
        </View>
      </View>
    );
  };

  const statusPedido = chat?.pedido?.status || "desconhecido";
  const nomeLoja = chat?.loja?.nome || nomeOutro || "Chat";

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
          <Text style={styles.headerNome}>{nomeLoja}</Text>
          <Text style={styles.headerStatus}>
            {chat?.ativo ? `Pedido #${pedidoId?.slice(-5)}` : "Chat encerrado"}
          </Text>
        </View>
        {!chat?.ativo && (
          <View style={styles.badgeEncerrado}>
            <Text style={styles.textoBadge}>Entregue</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ee3f0aff" style={{ flex: 1 }} />
      ) : mensagens.length === 0 ? (
        <View style={styles.semMensagens}>
          <Feather name="message-circle" size={48} color="#ccc" />
          <Text style={styles.textoSemMensagens}>
            Nenhuma mensagem ainda
          </Text>
          <Text style={styles.textoSemMensagensSecundario}>
            Comece a conversa!
          </Text>
        </View>
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

      {chat?.ativo ? (
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem..."
            value={novoTexto}
            onChangeText={setNovoTexto}
            multiline
            maxLength={500}
            editable={!enviando}
          />
          <TouchableOpacity
            style={[styles.sendBtn, enviando && styles.sendBtnDisabled]}
            onPress={enviarMensagem}
            disabled={enviando || !novoTexto.trim()}
          >
            {enviando ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.chatEncerradoInfo}>
          <Text style={styles.textoChatEncerrado}>
            Este chat foi encerrado após a entrega do pedido.
          </Text>
        </View>
      )}
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
    justifyContent: "space-between",
  },
  headerInfo: { marginLeft: 15, flex: 1 },
  headerNome: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerStatus: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  badgeEncerrado: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  textoBadge: { color: "#fff", fontSize: 11, fontWeight: "600" },
  listaMensagens: { padding: 20, paddingBottom: 10 },
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
  nomeAutor: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
    fontWeight: "600",
  },
  msgTexto: { fontSize: 15, color: "#333", lineHeight: 20 },
  minhaMsgTexto: { color: "#fff" },
  rodapeMensagem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  msgHora: {
    fontSize: 10,
    color: "#999",
  },
  inputArea: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    alignItems: "flex-end",
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
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: "#ee3f0aff",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#ccc",
  },
  semMensagens: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  textoSemMensagens: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 15,
  },
  textoSemMensagensSecundario: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
  chatEncerradoInfo: {
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  textoChatEncerrado: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});
