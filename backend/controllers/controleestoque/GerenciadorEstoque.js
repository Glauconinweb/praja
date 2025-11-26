// ===== LÓGICA DO GERENCIADOR DE ESTOQUE =====

const gerenciador = {
    produtos: new Map(),
    itensPausados: new Set(),
    notificacoesVendedor: [],

    _normalizarNome: nome => nome ? nome.trim().toLowerCase() : '',

    _adicionarNotificacao(mensagem) {
        this.notificacoesVendedor.push(`[${new Date().toLocaleTimeString('pt-BR')}] ${mensagem}`);
        atualizarInterface();
    },

    _atualizarStatusDisponibilidade(chave) {
        const produto = this.produtos.get(chave);
        if (!produto) return;

        const estavaPausado = this.itensPausados.has(chave);
        const deveEstarEmEstoque = produto.quantidade > 0;

        produto.emEstoque = deveEstarEmEstoque;

        if (deveEstarEmEstoque && estavaPausado) {
            this.itensPausados.delete(chave);
            this._adicionarNotificacao(`✅ Produto '${produto.nome}' despausado. Estoque reposto para ${produto.quantidade}.`);
        } else if (!deveEstarEmEstoque && !estavaPausado) {
            this.itensPausados.add(chave);
            this._adicionarNotificacao(`⚠️ ALERTA DE ESTOQUE: Produto '${produto.nome}' esgotado e PAUSADO AUTOMATICAMENTE.`);
        }
    },

    adicionarProduto(nome, quantidade) {
        const chave = this._normalizarNome(nome);
        if (!chave || typeof quantidade !== 'number' || quantidade <= 0) return (alert("Erro: Nome do produto inválido ou quantidade deve ser um número positivo."), false);

        if (this.produtos.has(chave)) {
            const p = this.produtos.get(chave);
            p.quantidade += quantidade;
            this._adicionarNotificacao(`📦 Estoque de '${nome}' aumentado em ${quantidade}. Novo total: ${p.quantidade}.`);
        } else {
            this.produtos.set(chave, { nome: nome.trim(), quantidade, emEstoque: true });
            this._adicionarNotificacao(`🆕 NOVO PRODUTO: '${nome}' adicionado com estoque inicial de ${quantidade}.`);
        }

        this._atualizarStatusDisponibilidade(chave);
        return true;
    },

    removerProduto(nome) {
        const chave = this._normalizarNome(nome);
        if (!chave) return (alert("Erro: Nome do produto inválido."), false);

        if (this.produtos.delete(chave)) {
            this.itensPausados.delete(chave);
            this._adicionarNotificacao(`🗑️ Produto '${nome}' removido do sistema.`);
            return true;
        }

        return (alert(`Aviso: Produto '${nome}' não encontrado.`), false);
    },

    verificarDisponibilidade: nome => {
        const p = gerenciador.produtos.get(gerenciador._normalizarNome(nome));
        return p?.emEstoque && p.quantidade > 0;
    },

    processarPedido(nome, quantidadePedida) {
        const chave = this._normalizarNome(nome);
        const produto = this.produtos.get(chave);

        if (!produto) return { sucesso: false, mensagemCliente: `O produto '${nome}' não está disponível para venda.`, mensagemVendedor: `ERRO: Tentativa de pedido para produto inexistente: '${nome}'.` };
        if (typeof quantidadePedida !== 'number' || quantidadePedida <= 0) return { sucesso: false, mensagemCliente: `Quantidade inválida para o pedido de '${nome}'.`, mensagemVendedor: `ERRO: Quantidade pedida inválida para '${nome}'.` };

        if (produto.quantidade < quantidadePedida) {
            const msgC = produto.quantidade === 0
                ? `O produto '${nome}' está esgotado no momento. Pedimos desculpas pelo inconveniente.`
                : `Não temos ${quantidadePedida} unidades de '${nome}' em estoque. Disponível: ${produto.quantidade}.`;

            return { sucesso: false, mensagemCliente: msgC, mensagemVendedor: `FALHA NO PEDIDO: Estoque insuficiente para '${nome}'. Pedido: ${quantidadePedida}, Estoque: ${produto.quantidade}.` };
        }

        produto.quantidade -= quantidadePedida;
        this._adicionarNotificacao(`📤 Pedido de ${quantidadePedida}x '${nome}' processado. Restante: ${produto.quantidade}.`);
        this._atualizarStatusDisponibilidade(chave);

        return { sucesso: true, mensagemCliente: `✅ Seu pedido de ${quantidadePedida}x '${nome}' foi processado com sucesso!`, mensagemVendedor: null };
    },

    consultarStatus(nome) {
        const p = this.produtos.get(this._normalizarNome(nome));
        return p ? {
            nome: p.nome,
            quantidade: p.quantidade,
            disponivelParaVenda: p.emEstoque,
            pausadoAutomaticamente: this.itensPausados.has(this._normalizarNome(nome))
        } : null;
    },

    listarEstoqueCompleto: () => Array.from(gerenciador.produtos.values()).map(p => gerenciador.consultarStatus(p.nome)),
    listarDisponiveis: () => gerenciador.listarEstoqueCompleto().filter(p => p.disponivelParaVenda),
    listarPausados: () => gerenciador.listarEstoqueCompleto().filter(p => p.pausadoAutomaticamente),
    obterNotificacoesVendedor: () => gerenciador.notificacoesVendedor,
    limparNotificacoesVendedor() {
        this.notificacoesVendedor = [];
        this._adicionarNotificacao("🗑️ Notificações limpas pelo vendedor.");
    }
};

//FUNÇÕES DA INTERFACE

const $ = id => document.getElementById(id);
const $Q = sel => document.querySelectorAll(sel);
const getVal = id => $(id)?.value;
const getNum = id => parseInt(getVal(id));
const obterValores = (idNome, idQtd) => ({ nome: getVal(idNome), quantidade: idQtd ? getNum(idQtd) : null });

// Função auxiliar para criar elementos
const criarEl = (tag, classes = [], text = '', children = []) => {
    const el = document.createElement(tag);
    if (classes.length) el.className = classes.join(' ');
    if (text) el.textContent = text;
    children.forEach(child => el.appendChild(child));
    return el;
};

function adicionarProduto() {
    const { nome, quantidade } = obterValores('nomeProdutoAdicionar', 'quantidadeAdicionar');
    if (!nome || isNaN(quantidade)) return alert("Por favor, preencha todos os campos corretamente.");
    gerenciador.adicionarProduto(nome, quantidade);
    $('nomeProdutoAdicionar').value = $('quantidadeAdicionar').value = '';
}

function removerProduto() {
    const { nome } = obterValores('nomeProdutoRemover');
    if (!nome) return alert("Por favor, digite o nome do produto.");
    if (confirm(`Tem certeza que deseja remover o produto '${nome}'?`)) {
        gerenciador.removerProduto(nome);
        $('nomeProdutoRemover').value = '';
    }
}

function processarPedido() {
    const { nome, quantidade } = obterValores('nomeProdutoPedido', 'quantidadePedido');
    if (!nome || isNaN(quantidade)) return alert("Por favor, preencha todos os campos corretamente.");

    const resultado = gerenciador.processarPedido(nome, quantidade);
    const resDiv = $('resultadoPedido'), msgDiv = $('mensagemPedido');

    resDiv.className = resultado.sucesso ? 'pedido-sucesso show' : 'pedido-erro show';
    msgDiv.textContent = resultado.mensagemCliente;

    $('nomeProdutoPedido').value = $('quantidadePedido').value = '';
}

function limparNotificacoes() { gerenciador.limparNotificacoesVendedor(); }

function mudarAba(abaId) {
    $Q('.tab-content').forEach(a => a.classList.remove('active'));
    $Q('.tab-button').forEach(b => b.classList.remove('active'));
    $(abaId).classList.add('active');
    event.target.classList.add('active');
}

// Função auxiliar para renderizar listas usando DOM puro
const renderizarLista = (id, lista, elementFn, msgVazia) => {
    const container = $(id);
    container.innerHTML = ''; // Limpa o container sem usar string HTML para o conteúdo
    
    if (lista.length === 0) {
        container.appendChild(criarEl('p', ['empty-message'], msgVazia));
    } else {
        lista.forEach(item => container.appendChild(elementFn(item)));
    }
};

// Função para criar o elemento de notificação
const criarNotificacaoElemento = (notif) => {
    let c = ['notification'];
    if (notif.includes('ALERTA') || notif.includes('⚠️')) c.push('alert');
    else if (notif.includes('✅') || notif.includes('NOVO PRODUTO')) c.push('success');
    else if (notif.includes('🗑️')) c.push('warning');
    return criarEl('p', c, notif);
};

// Função para criar o elemento de produto
const criarProdutoElemento = (p, isPausado = false) => {
    const statusClass = p.disponivelParaVenda ? 'status-available' : 'status-paused';
    const statusText = p.disponivelParaVenda ? '✅ Disponível' : '❌ Esgotado';
    
    const statusSpan = criarEl('span', ['product-status', isPausado ? 'status-paused' : statusClass], isPausado ? '❌ Esgotado' : statusText);
    const qtdStrong = criarEl('strong', [], p.quantidade.toString());
    
    const detailsSpan = criarEl('span', ['product-details'], 'Qtd: ', [qtdStrong, document.createTextNode(' | '), statusSpan]);
    
    const nameSpan = criarEl('span', ['product-name'], p.nome);
    
    return criarEl('p', ['product-item'], '', [nameSpan, detailsSpan]);
};

// Função para criar o elemento de produto para o cliente (mais simples)
const criarProdutoClienteElemento = (p) => {
    const qtdStrong = criarEl('strong', [], p.quantidade.toString());
    const detailsSpan = criarEl('span', ['product-details'], 'Qtd em estoque: ', [qtdStrong]);
    const nameSpan = criarEl('span', ['product-name'], p.nome);
    
    return criarEl('p', ['product-item'], '', [nameSpan, detailsSpan]);
};


function atualizarInterface() {
    const estoque = gerenciador.listarEstoqueCompleto();
    const disponiveis = gerenciador.listarDisponiveis();
    const pausados = gerenciador.listarPausados();

    // Notificações
    renderizarLista('notificacoesContainer', gerenciador.obterNotificacoesVendedor(), criarNotificacaoElemento, 'Nenhuma notificação ainda...');

    // Estoque Completo
    renderizarLista('estoqueContainer', estoque, criarProdutoElemento, 'Nenhum produto cadastrado ainda...');

    // Pausados
    renderizarLista('pausadosContainer', pausados, p => criarProdutoElemento(p, true), 'Nenhum produto pausado...');

    // Disponíveis (Cliente)
    renderizarLista('disponiveisContainer', disponiveis, criarProdutoClienteElemento, 'Nenhum produto disponível...');

    // Estatísticas
    $('totalProdutos').textContent = estoque.length;
    $('totalDisponivel').textContent = disponiveis.length;
    $('totalPausados').textContent = pausados.length;
}

// Inicialização
document.addEventListener('DOMContentLoaded', atualizarInterface);
