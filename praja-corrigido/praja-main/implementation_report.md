# Relatório de Implementação: Chat de Delivery

Este documento detalha as modificações realizadas no aplicativo de delivery para implementar um sistema de chat entre clientes e vendedores, seguindo as regras especificadas.

## 1. Visão Geral das Regras do Chat

As seguintes regras foram consideradas e implementadas para o sistema de chat:

*   **Disponibilidade do Chat**: O chat é disponibilizado ao cliente **após a criação de um pedido** e permanece ativo enquanto o pedido não for marcado como "entregue" ou "cancelado".
*   **Fechamento do Chat**: O chat é automaticamente fechado e desativado **após a confirmação da entrega** do pedido.
*   **Múltiplas Conversas**: Caso um cliente faça pedidos em diferentes lojas, um **canal de comunicação distinto** é aberto para cada loja, garantindo que as conversas não se misturem.
*   **Notificação ao Vendedor**: Embora a notificação em tempo real não tenha sido implementada com WebSockets neste escopo inicial (devido à complexidade e tempo), a arquitetura prevê a fácil integração. Atualmente, o vendedor pode visualizar novos chats e mensagens ao acessar a tela de pedidos.

## 2. Alterações no Modelo de Dados (Prisma Schema)

Para suportar a funcionalidade de pedidos e chat, o arquivo `prisma/schema.prisma` foi atualizado com novos modelos e relacionamentos:

```prisma
model User {
  // ... campos existentes ...
  pedidosCliente Pedido[] @relation("ClientePedidos")
  pedidosLoja    Pedido[] @relation("LojaPedidos")
  chatsComoCliente Chat[] @relation("ChatCliente")
  chatsComoLoja    Chat[] @relation("ChatLoja")
  mensagensEnviadas Mensagem[]
}

model Produto {
  // ... campos existentes ...
  itensPedido   ItemPedido[]
}

model Pedido {
  id          String      @id @default(auto()) @map("_id") @db.ObjectId
  clienteId   String      @db.ObjectId
  cliente     User        @relation("ClientePedidos", fields: [clienteId], references: [id])
  lojaId      String      @db.ObjectId
  loja        User        @relation("LojaPedidos", fields: [lojaId], references: [id])
  status      String      @default("pendente") // pendente, preparando, em_rota, entregue, cancelado
  total       Float
  itens       ItemPedido[]
  chat        Chat?       @relation(fields: [chatId], references: [id])
  chatId      String?     @unique @db.ObjectId
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model ItemPedido {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  pedidoId  String   @db.ObjectId
  pedido    Pedido   @relation(fields: [pedidoId], references: [id])
  produtoId String   @db.ObjectId
  produto   Produto  @relation(fields: [produtoId], references: [id])
  quantidade Int
  precoUnit Float
}

model Chat {
  id          String     @id @default(auto()) @map("_id") @db.ObjectId
  pedidoId    String     @unique @db.ObjectId
  pedido      Pedido     @relation(fields: [pedidoId], references: [id])
  clienteId   String     @db.ObjectId
  cliente     User       @relation("ChatCliente", fields: [clienteId], references: [id])
  lojaId      String     @db.ObjectId
  loja        User       @relation("ChatLoja", fields: [lojaId], references: [id])
  ativo       Boolean    @default(true)
  mensagens   Mensagem[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Mensagem {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  chatId    String   @db.ObjectId
  chat      Chat     @relation(fields: [chatId], references: [id])
  autorId   String   @db.ObjectId
  autor     User     @relation(fields: [autorId], references: [id])
  texto     String
  lida      Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

*   **`Pedido`**: Representa um pedido feito por um cliente a uma loja. Inclui `clienteId`, `lojaId`, `status`, `total` e uma lista de `itens`.
*   **`ItemPedido`**: Detalha os produtos dentro de um `Pedido`, incluindo `produtoId`, `quantidade` e `precoUnit`.
*   **`Chat`**: Representa uma conversa específica associada a um `Pedido`. Contém `pedidoId`, `clienteId`, `lojaId` e um campo `ativo` para controlar a disponibilidade do chat. O relacionamento `pedidoId` é `@unique` para garantir um chat por pedido.
*   **`Mensagem`**: Armazena as mensagens trocadas no chat, com `chatId`, `autorId` (quem enviou a mensagem), `texto` e `lida`.

## 3. Implementação do Backend (Node.js com Express e Prisma)

Foram criados novos controladores e rotas para gerenciar pedidos e o sistema de chat.

### 3.1. `pedidoController.js`

Este controlador gerencia as operações relacionadas aos pedidos:

*   **`criarPedido`**: Cria um novo pedido no banco de dados, associando-o a um cliente e uma loja, e incluindo os itens do pedido.
*   **`atualizarStatusPedido`**: Permite a atualização do status de um pedido. **Importante**: Se o status for alterado para "entregue", o chat associado a esse pedido é automaticamente desativado (`ativo: false`).
*   **`listarPedidosUsuario`**: Lista todos os pedidos de um determinado usuário, seja ele cliente ou vendedor.

### 3.2. `chatController.js`

Este controlador lida com a lógica do chat:

*   **`getOrCreateChat`**: Busca um chat existente para um `pedidoId` específico. Se não existir e o pedido não estiver entregue, um novo chat é criado. Isso garante que um chat só é iniciado após um pedido e que não é possível iniciar um chat para pedidos já finalizados.
*   **`enviarMensagem`**: Adiciona uma nova mensagem a um chat existente. Verifica se o chat está ativo antes de permitir o envio.
*   **`listarMensagens`**: Retorna todas as mensagens de um chat específico, ordenadas cronologicamente.
*   **`listarChatsAtivos`**: Lista todos os chats ativos para um `userId` (cliente ou loja), permitindo que os usuários vejam suas conversas em andamento.

### 3.3. Rotas (`routes/pedidoRoutes.js` e `routes/chatRoutes.js`)

Novos arquivos de rota foram criados e integrados ao `server.js`:

*   **`pedidoRoutes.js`**:
    *   `POST /api/pedidos/criar`: Cria um novo pedido.
    *   `PUT /api/pedidos/:id/status`: Atualiza o status de um pedido.
    *   `GET /api/pedidos/usuario/:userId`: Lista pedidos de um usuário.

*   **`chatRoutes.js`**:
    *   `GET /api/chat/pedido/:pedidoId`: Obtém ou cria um chat para um pedido.
    *   `POST /api/chat/:chatId/mensagens`: Envia uma mensagem para um chat.
    *   `GET /api/chat/:chatId/mensagens`: Lista as mensagens de um chat.
    *   `GET /api/chat/usuario/:userId`: Lista os chats ativos de um usuário.

## 4. Implementação do Frontend (React Native com Expo Router)

As seguintes telas e modificações foram feitas no frontend:

### 4.1. `app/tabs/pedidos.tsx` (Nova Tela de Pedidos)

Esta tela exibe a lista de pedidos do usuário (cliente ou vendedor). Cada card de pedido inclui:

*   Nome da loja e status do pedido.
*   Detalhes dos itens do pedido.
*   Um botão "Chat" que, ao ser clicado, navega para a tela de chat, passando o `chatId`, `pedidoId` e o nome do outro participante (loja ou cliente). Este botão só é visível para pedidos que não foram "entregues" ou "cancelados", garantindo a regra de disponibilidade do chat.

### 4.2. `app/chat.tsx` (Nova Tela de Chat)

Esta tela é a interface principal para a troca de mensagens. Ela:

*   Exibe as mensagens de um chat específico, diferenciando as mensagens do usuário logado das mensagens do outro participante.
*   Permite ao usuário digitar e enviar novas mensagens.
*   Realiza polling a cada 3 segundos para buscar novas mensagens, simulando uma atualização em tempo real (para uma solução mais robusta, WebSockets seriam ideais).
*   O cabeçalho da tela mostra o nome do outro participante e um identificador do pedido.

### 4.3. Integração no `app/tabs/_layout.tsx`

A nova aba "Pedidos" foi adicionada à navegação principal do aplicativo:

```typescript
<Tabs.Screen
  name="pedidos" // Você precisará criar pedidos.tsx
  options={{
    title: "Pedidos",
    tabBarIcon: ({ color }) => (
      <Feather name="shopping-bag" size={24} color={color} />
    ),
  }}
/>
```

### 4.4. Integração no `app/tabs/minha-loja.tsx`

O botão "Pedidos" no painel da loja agora navega para a nova tela de pedidos:

```typescript
<TouchableOpacity 
  style={styles.menuItem}
  onPress={() => router.push("/tabs/pedidos")}
>
  <View style={styles.iconBg}>
    <Feather name="list" size={24} color="#ee3f0aff" />
  </View>
  <Text style={styles.menuText}>Pedidos</Text>
</TouchableOpacity>
```

## 5. Teste e Validação

Um script de teste (`test_chat_flow.js`) foi criado para validar o fluxo básico do chat, incluindo:

1.  Criação de usuários (cliente e vendedor).
2.  Criação de um produto.
3.  Criação de um pedido.
4.  Criação de um chat associado ao pedido.
5.  Envio de uma mensagem.
6.  Atualização do status do pedido para "entregue" e verificação do fechamento do chat.

Este script pode ser executado para verificar a integridade da lógica do backend.

## 6. Próximos Passos e Melhorias

*   **WebSockets**: Para uma experiência de chat em tempo real, a implementação de WebSockets (ex: Socket.io) seria a próxima etapa crucial, substituindo o polling atual.
*   **Notificações Push**: Implementar notificações push para vendedores quando um novo chat é iniciado ou uma nova mensagem é recebida.
*   **Interface de Pedidos para Vendedor**: Aprimorar a tela de pedidos para vendedores, permitindo que eles gerenciem o status dos pedidos e visualizem informações relevantes de forma mais eficiente.
*   **Autenticação e Autorização**: Garantir que todas as rotas de chat e pedidos estejam devidamente protegidas com autenticação e autorização para que apenas usuários autorizados possam acessar e interagir com os chats e pedidos.
*   **Tratamento de Erros no Frontend**: Melhorar o tratamento de erros e feedback visual para o usuário no frontend.

Com estas implementações, o aplicativo agora possui uma base sólida para a funcionalidade de chat, aderindo às regras de negócio especificadas.
