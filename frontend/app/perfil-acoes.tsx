import React, { useState } from 'react';
import { View, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useUserActions } from '../hooks/useUserActions';
import { UserActionsList } from '../components/UserActionsList';

export default function PerfilAcoesScreen() {
  // Em um cenário real, o userId viria do contexto de autenticação
  const userId = "USER_ID_MOCK"; 
  const { favoritos, historico, loading } = useUserActions(userId);
  const [activeTab, setActiveTab] = useState<'favoritos' | 'historico'>('favoritos');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Tab Selector */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => setActiveTab('favoritos')}
          className={`flex-1 py-4 items-center ${activeTab === 'favoritos' ? 'border-b-2 border-primary' : ''}`}
        >
          <Text className={`font-bold ${activeTab === 'favoritos' ? 'text-primary' : 'text-gray-500'}`}>
            Favoritos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('historico')}
          className={`flex-1 py-4 items-center ${activeTab === 'historico' ? 'border-b-2 border-primary' : ''}`}
        >
          <Text className={`font-bold ${activeTab === 'historico' ? 'text-primary' : 'text-gray-500'}`}>
            Histórico
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text>Carregando...</Text>
        </View>
      ) : (
        <View className="flex-1">
          {activeTab === 'favoritos' ? (
            <UserActionsList 
              title="Meus Favoritos" 
              items={favoritos} 
              emptyMessage="Você ainda não favoritou nenhum produto."
            />
          ) : (
            <UserActionsList 
              title="Vistos Recentemente" 
              items={historico} 
              emptyMessage="Seu histórico está vazio."
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}