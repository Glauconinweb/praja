import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function Register() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState("cliente");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!nome || !email || !senha || !confirmarSenha)
      return Alert.alert("Atenção", "Preencha todos os campos.");
    if (senha !== confirmarSenha)
      return Alert.alert("Erro", "As senhas não coincidem.");
    if (senha.length < 6)
      return Alert.alert("Senha fraca", "Mínimo 6 caracteres.");

    setLoading(true);
    try {
      // ⚠️ Use o seu IP aqui
      const baseUrl = `${process.env.EXPO_PUBLIC_API_URL}/register`;

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha, tipo: tipoUsuario }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert("Sucesso", "Cadastro realizado!", [
          { text: "OK", onPress: () => router.replace("./Login") },
        ]);
      } else {
        Alert.alert("Erro", data.message || "Não foi possível cadastrar.");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro de Conexão", "Verifique o IP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Box Responsivo */}
        <View style={styles.responsiveBox}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.titulo}>Criar Conta</Text>
            <Text style={styles.subtitulo}>
              Preencha os dados para começar.
            </Text>
          </View>

          <Text style={styles.labelTipo}>Eu sou:</Text>
          <View style={styles.typeContainer}>
            {["cliente", "vendedor", "entregador"].map((tipo) => (
              <TouchableOpacity
                key={tipo}
                style={[
                  styles.typeBtn,
                  tipoUsuario === tipo && styles.typeBtnActive,
                ]}
                onPress={() => setTipoUsuario(tipo)}
              >
                <Feather
                  name={
                    tipo === "cliente"
                      ? "shopping-cart"
                      : tipo === "vendedor"
                        ? "shopping-bag"
                        : "truck"
                  }
                  size={20}
                  color={tipoUsuario === tipo ? "#ee3f0aff" : "#fff"}
                />
                <Text
                  style={[
                    styles.typeText,
                    tipoUsuario === tipo && styles.typeTextActive,
                  ]}
                >
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campos */}
          <View style={styles.inputContainer}>
            <Feather
              name="user"
              size={20}
              color="#ee3f0aff"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor="#666"
              value={nome}
              onChangeText={setNome}
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather
              name="mail"
              size={20}
              color="#ee3f0aff"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Seu email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather
              name="lock"
              size={20}
              color="#ee3f0aff"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Crie uma senha"
              placeholderTextColor="#666"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
            />
            <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)}>
              <Feather
                name={mostrarSenha ? "eye" : "eye-off"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Feather
              name="check-circle"
              size={20}
              color="#ee3f0aff"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirme a senha"
              placeholderTextColor="#666"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry={true}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ee3f0aff" />
            ) : (
              <Text style={styles.buttonText}>CADASTRAR</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <Link href="./Login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkBold}>Faça Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ee3f0aff",
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // --- RESPONSIVIDADE ---
  responsiveBox: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },
  // ----------------------
  backButton: { marginBottom: 20, alignSelf: "flex-start" },
  header: { marginBottom: 20 },
  titulo: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 5 },
  subtitulo: { fontSize: 16, color: "rgba(255,255,255,0.8)" },
  labelTipo: {
    color: "#fff",
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fff",
    backgroundColor: "transparent",
  },
  typeBtnActive: { backgroundColor: "#fff", borderColor: "#fff" },
  typeText: { color: "#fff", fontSize: 12, marginTop: 5, fontWeight: "600" },
  typeTextActive: { color: "#ee3f0aff" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 15,
    elevation: 2,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#333" },
  button: {
    backgroundColor: "#fff",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 3,
  },
  buttonText: { color: "#ee3f0aff", fontSize: 18, fontWeight: "bold" },
  footer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 20,
  },
  footerText: { color: "#fff", fontSize: 15 },
  linkBold: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
