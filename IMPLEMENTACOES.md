# Praja - Documentação das Implementações

Este documento descreve todas as funcionalidades implementadas no sistema de pagamentos do app Praja Delivery.

---

## Resumo das Implementações

### Arquivos Novos (Backend)

| Arquivo | Descrição |
|---|---|
| `backend/controllers/pagamentoController.js` | Lógica completa de pagamentos: seleção de método, código de 6 dígitos, confirmação de entrega e separação de valores |
| `backend/controllers/planoController.js` | Gerenciamento de planos para vendedores (Gratuito, Básico, Pro, Premium) |
| `backend/controllers/pixController.js` | Cadastro, consulta e remoção de chaves Pix para vendedores e entregadores |
| `backend/routes/pagamentoRoutes.js` | Rotas de pagamento |
| `backend/routes/planoRoutes.js` | Rotas de planos |
| `backend/routes/pixRoutes.js` | Rotas de chaves Pix |

### Arquivos Modificados (Backend)

| Arquivo | Alterações |
|---|---|
| `backend/prisma/schema.prisma` | Adicionados modelos: `Pagamento`, `Transacao`, `Plano`, `Assinatura`. Adicionados campos ao `User` (`chavePix`, `tipoChavePix`, `planoId`) e ao `Pedido` (`taxaEntrega`, `valorProdutos`, `statusPagamento`, `codigoConfirmacao`, etc.) |
| `backend/controllers/pedidoController.js` | Atualizado para incluir taxa de entrega, entregador e status de pagamento |
| `backend/routes/pedidoRoutes.js` | Adicionadas rotas: aceitar pedido, listar pedidos disponíveis |
| `backend/server.js` | Registradas as novas rotas de pagamento, planos e Pix |

### Arquivos Novos (Frontend)

| Arquivo | Descrição |
|---|---|
| `frontend/app/pagamento.tsx` | Tela de seleção de método de pagamento (Pix, Cartão Débito/Crédito, Espécie) com exibição da chave Pix e código de 6 dígitos |
| `frontend/app/gerenciar-pix.tsx` | Tela para vendedores e entregadores cadastrarem/atualizarem chaves Pix |
| `frontend/app/planos.tsx` | Tela de planos disponíveis para vendedores com assinatura |
| `frontend/app/confirmar-entrega.tsx` | Tela para entregadores inserirem o código de 6 dígitos e confirmarem a entrega |
| `frontend/app/fazer-pedido.tsx` | Tela completa de pedidos para clientes com carrinho, filtros, busca e checkout |

### Arquivos Modificados (Frontend)

| Arquivo | Alterações |
|---|---|
| `frontend/app/tabs/pedidos.tsx` | Atualizado com botões de pagamento (cliente), confirmação de entrega (entregador), exibição do código de 6 dígitos, separação de valores e pull-to-refresh |

---

## Fluxo Completo de Pagamento

```
1. Cliente navega pela loja (fazer-pedido.tsx)
   └── Adiciona produtos ao carrinho
   └── Clica em "Finalizar Pedido"

2. Sistema cria o pedido no banco (POST /api/pedidos/criar)
   └── Registra: clienteId, lojaId, itens, total, taxaEntrega, valorProdutos

3. Cliente é redirecionado para pagamento (pagamento.tsx)
   └── Informa nome e endereço
   └── Escolhe método: Pix / Cartão Débito / Cartão Crédito / Espécie

4. Sistema registra o pagamento (POST /api/pagamentos/selecionar-metodo)
   └── Gera código de 6 dígitos aleatório
   └── Cria transações pendentes (produto → vendedor, entrega → entregador)
   └── Se Pix: exibe chave Pix do vendedor para o cliente copiar
   └── Retorna o código de 6 dígitos ao cliente

5. Cliente recebe o pedido e mostra o código ao entregador

6. Entregador insere o código (confirmar-entrega.tsx)
   └── Sistema valida o código (POST /api/pagamentos/confirmar-entrega)
   └── Marca pedido como "entregue"
   └── Libera transações: valor do produto → vendedor, taxa → entregador
   └── Chama API de repasse (placeholder para integração)
```

---

## Endpoints da API

### Pagamentos (`/api/pagamentos`)

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/selecionar-metodo` | Registra método de pagamento e gera código de 6 dígitos |
| POST | `/confirmar-entrega` | Valida código e libera pagamentos |
| GET | `/pedido/:pedidoId` | Detalhes do pagamento de um pedido |
| GET | `/codigo/:pedidoId/:clienteId` | Código de confirmação (apenas cliente do pedido) |
| GET | `/transacoes/:userId` | Lista transações de um vendedor/entregador |

### Planos (`/api/planos`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Lista todos os planos disponíveis |
| POST | `/seed` | Inicializa os planos padrão no banco (executar uma vez) |
| POST | `/assinar` | Assina um plano |
| GET | `/vendedor/:vendedorId` | Plano atual de um vendedor |

### Chaves Pix (`/api/pix`)

| Método | Endpoint | Descrição |
|---|---|---|
| PUT | `/chave/:userId` | Cadastra ou atualiza chave Pix |
| GET | `/chave/:userId` | Consulta chave Pix de um usuário |
| DELETE | `/chave/:userId` | Remove chave Pix |

---

## Integração com API de Pagamentos

O sistema está **preparado para integração** com qualquer API de pagamentos gratuita. Os placeholders estão nas funções `_chamarApiPagamento` e `_chamarApiRepasse` dentro de `pagamentoController.js`.

### APIs Gratuitas Recomendadas

| API | Tipo | Link |
|---|---|---|
| **OpenPix** | Pix gratuito, sem taxas | https://developers.openpix.com.br |
| **Asaas** | Pix + Boleto, plano gratuito | https://docs.asaas.com |
| **Pagar.me Sandbox** | Testes gratuitos | https://docs.pagar.me |
| **Mercado Pago** | Pix + Cartão, sem mensalidade | https://www.mercadopago.com.br/developers |

### Como Integrar (Exemplo com OpenPix)

No arquivo `backend/controllers/pagamentoController.js`, localize a função `_chamarApiPagamento` e substitua pelo código real:

```javascript
async function _chamarApiPagamento(dadosPagamento) {
  const response = await fetch('https://api.openpix.com.br/api/v1/charge', {
    method: 'POST',
    headers: {
      'Authorization': process.env.OPENPIX_APP_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      correlationID: dadosPagamento.pedidoId,
      value: Math.round(dadosPagamento.valor * 100), // em centavos
      comment: `Pedido #${dadosPagamento.pedidoId}`
    })
  });
  return await response.json();
}
```

Adicione no `.env` do backend:
```
OPENPIX_APP_ID=sua_chave_aqui
```

---

## Planos para Vendedores

| Plano | Preço | Produtos | Pedidos/mês | Taxa Plataforma |
|---|---|---|---|---|
| Gratuito | R$ 0 | Até 5 | Até 20 | 5% |
| Básico | R$ 29,90/mês | Até 30 | Até 100 | 3% |
| Pro | R$ 79,90/mês | Até 100 | Até 500 | 1,5% |
| Premium | R$ 149,90/mês | Ilimitado | Ilimitado | 0% |

> **Nota:** Para ativar os planos no banco de dados, execute uma vez: `POST /api/planos/seed`

---

## Chaves Pix

### Tipos Suportados

- **CPF** — Validação de 11 dígitos
- **CNPJ** — Validação de 14 dígitos
- **E-mail** — Validação de formato
- **Telefone** — Formatação automática com +55
- **Chave Aleatória** — Qualquer string UUID

### Fluxo

1. Vendedor/Entregador acessa "Gerenciar Pix" e cadastra sua chave
2. Ao cliente escolher Pix como método, a chave do vendedor é exibida
3. Cliente copia a chave e realiza o pagamento no seu banco
4. Após receber o pedido, cliente mostra o código de 6 dígitos ao entregador
5. Entregador insere o código → valores são liberados

---

## Separação de Valores

Ao confirmar a entrega com o código de 6 dígitos:

```
Total do Pedido = Valor dos Produtos + Taxa de Entrega

Transação 1 (Vendedor):
  Valor = Valor dos Produtos × (1 - Taxa da Plataforma / 100)
  Ex: R$ 50,00 × (1 - 5%) = R$ 47,50

Transação 2 (Entregador):
  Valor = Taxa de Entrega completa
  Ex: R$ 5,00
```

---

## Configuração Inicial

### Backend

```bash
cd backend
npm install
# Configure o .env com DATABASE_URL e outras variáveis
npx prisma generate
npx prisma db push
npm run dev
```

### Inicializar Planos (uma vez)

```bash
curl -X POST http://localhost:5001/api/planos/seed
```

### Frontend

```bash
cd frontend
npm install
npx expo start
```

---

## Navegação (Expo Router)

As novas telas estão registradas automaticamente pelo Expo Router:

| Rota | Tela | Parâmetros |
|---|---|---|
| `/pagamento` | Seleção de pagamento | `pedidoId`, `total`, `taxaEntrega`, `nomeLoja` |
| `/confirmar-entrega` | Confirmação pelo entregador | `pedidoId`, `nomeCliente`, `enderecoEntrega`, `valorTotal`, `metodoPagamento` |
| `/gerenciar-pix` | Cadastro de chave Pix | — |
| `/planos` | Planos para vendedores | — |
| `/fazer-pedido` | Tela de pedidos do cliente | `lojaId` |

Para navegar para as novas telas, adicione links nas telas existentes conforme necessário. Por exemplo, para acessar os planos a partir da tela "Minha Loja":

```tsx
import { useRouter } from "expo-router";
const router = useRouter();

// Botão para acessar planos
<TouchableOpacity onPress={() => router.push("/planos")}>
  <Text>Ver Planos</Text>
</TouchableOpacity>

// Botão para gerenciar Pix
<TouchableOpacity onPress={() => router.push("/gerenciar-pix")}>
  <Text>Gerenciar Chave Pix</Text>
</TouchableOpacity>
```
