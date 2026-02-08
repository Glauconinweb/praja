import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.136.147.8:5001/api/user'; // IP atualizado conforme sua mensagem

export const userActionsService = {
  // Favoritos
  async toggleFavorito(userId: string, produtoId: string) {
    try {
      const response = await fetch(`${API_URL}/favoritos/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, produtoId }),
      });
      return await response.json();
    } catch (error) {
      console.error('Erro ao toggle favorito:', error);
      return this.toggleFavoritoLocal(produtoId);
    }
  },

  async getFavoritos(userId: string) {
    try {
      const response = await fetch(`${API_URL}/favoritos/${userId}`);
      const data = await response.json();
      // Se o servidor retornar erro ou não for array, usa o local
      if (!Array.isArray(data)) return this.getFavoritosLocal();
      return data;
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      return this.getFavoritosLocal();
    }
  },

  // Histórico
  async registrarVisualizacao(userId: string, produtoId: string) {
    try {
      await fetch(`${API_URL}/historico/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, produtoId }),
      });
    } catch (error) {
      console.error('Erro ao registrar histórico:', error);
      this.registrarVisualizacaoLocal(produtoId);
    }
  },

  async getHistorico(userId: string) {
    try {
      const response = await fetch(`${API_URL}/historico/${userId}`);
      const data = await response.json();
      if (!Array.isArray(data)) return this.getHistoricoLocal();
      return data;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return this.getHistoricoLocal();
    }
  },

  // Fallbacks Locais (AsyncStorage)
  // Nota: Para o local funcionar perfeitamente com a UI, o ideal seria salvar o objeto do produto,
  // mas para manter a flexibilidade, vamos garantir que o retorno local seja tratado.
  async toggleFavoritoLocal(produtoId: string) {
    const favs = await this.getFavoritosLocal();
    // Verifica se favs é array de strings (IDs) ou objetos
    const index = favs.findIndex((item: any) => (typeof item === 'string' ? item === produtoId : item.id === produtoId));
    
    if (index > -1) {
      favs.splice(index, 1);
    } else {
      // No local, salvamos apenas o ID por simplicidade, 
      // mas a UI espera um objeto com .id
      favs.push({ id: produtoId }); 
    }
    await AsyncStorage.setItem('@praja:favoritos', JSON.stringify(favs));
    return { favoritado: index === -1 };
  },

  async getFavoritosLocal() {
    const favs = await AsyncStorage.getItem('@praja:favoritos');
    const parsed = favs ? JSON.parse(favs) : [];
    // Garante que cada item seja um objeto com a propriedade 'id'
    return parsed.map((item: any) => typeof item === 'string' ? { id: item } : item);
  },

  async registrarVisualizacaoLocal(produtoId: string) {
    let hist = await this.getHistoricoLocal();
    // Remove duplicatas e adiciona ao início
    hist = [{ id: produtoId }, ...hist.filter((item: any) => item.id !== produtoId)].slice(0, 20);
    await AsyncStorage.setItem('@praja:historico', JSON.stringify(hist));
  },

  async getHistoricoLocal() {
    const hist = await AsyncStorage.getItem('@praja:historico');
    const parsed = hist ? JSON.parse(hist) : [];
    return parsed.map((item: any) => typeof item === 'string' ? { id: item } : item);
  }
};