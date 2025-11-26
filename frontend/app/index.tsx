import { Redirect } from "expo-router";

export default function Index() {
  // Redireciona imediatamente para a dashboard dentro das abas
  return <Redirect href="./tabs" />;
}
