import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState("cliente");

  async function handleLogin() {
    if (!email || !senha)
      return Alert.alert("Atenção", "Preencha email e senha.");
    setLoading(true);

    try {
      // ⚠️ Use o seu IP aqui. Ex: 192.168.X.X
      // Pega a URL do .env e concatena com o endpoint de login
      const baseUrl = `${process.env.EXPO_PUBLIC_API_URL}/login`;
      let endpoint = "";

      if (tipoUsuario === "cliente") endpoint = "/cliente";
      else if (tipoUsuario === "vendedor") endpoint = "/vendedor";
      else if (tipoUsuario === "entregador") endpoint = "/entregador";

      const response = await fetch(baseUrl, {
        // baseUrl já é .../api/login
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }), // O back identifica o tipo pelo e-mail
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem("token", data.token);
        const userToSave = { tipo: data.tipo, token: data.token, email: email };
        await AsyncStorage.setItem("user", JSON.stringify(userToSave));
        Alert.alert("Sucesso", `Bem-vindo, ${tipoUsuario}!`);
        router.replace("./");
      } else {
        Alert.alert("Erro", data.message || "Falha ao entrar.");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro de Conexão", "Verifique o IP e o servidor.");
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
        {/* Container Responsivo para Web */}
        <View style={styles.responsiveBox}>
          <View style={styles.logoArea}>
            <Feather name="shopping-bag" size={60} color="#fff" />
            <Text style={styles.logoText}>Prajá</Text>
          </View>

          <Text style={styles.titulo}>Bem-vindo!</Text>
          <Text style={styles.subtitulo}>Quem é você?</Text>

          {/* Seletor de Tipo */}
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

          {/* Inputs */}
          <View style={styles.inputContainer}>
            <Feather
              name="mail"
              size={20}
              color="#ee3f0aff"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder={`Email do ${tipoUsuario}`}
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
              placeholder="Sua senha"
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

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ee3f0aff" />
            ) : (
              <Text style={styles.buttonText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <Link href="./Register" asChild>
              <TouchableOpacity>
                <Text style={styles.linkBold}>Cadastre-se</Text>
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
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center", // Centraliza o box na tela
    padding: 20,
  },
  // --- A MÁGICA DA RESPONSIVIDADE AQUI ---
  responsiveBox: {
    width: "100%",
    maxWidth: 500, // No PC, trava em 500px. No celular, usa 100%.
    alignSelf: "center",
  },
  // ---------------------------------------
  logoArea: { alignItems: "center", marginBottom: 30 },
  logoText: { color: "#fff", fontSize: 30, fontWeight: "bold", marginTop: 10 },
  titulo: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 5 },
  subtitulo: { fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 20 },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: { color: "#ee3f0aff", fontSize: 18, fontWeight: "bold" },
  footer: { marginTop: 30, flexDirection: "row", justifyContent: "center" },
  footerText: { color: "#fff", fontSize: 15 },
  linkBold: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
});
