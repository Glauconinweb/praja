import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface Product {
  id: string;
  nome?: string;
  preco?: number;
  imagem?: string;
}

interface UserActionsListProps {
  title: string;
  items: Product[];
  emptyMessage: string;
}

export const UserActionsList: React.FC<UserActionsListProps> = ({ title, items, emptyMessage }) => {
  const router = useRouter();

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/produto/${item.id}`)}
      className="flex-row items-center p-4 mb-2 bg-white rounded-lg shadow-sm"
    >
      <Image 
        source={{ uri: item.imagem || 'https://via.placeholder.com/150' }} 
        className="w-16 h-16 rounded-md"
      />
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-800">
          {item.nome || `Produto #${item.id.substring(0, 6)}`}
        </Text>
        {item.preco !== undefined && (
          <Text className="text-primary font-semibold">R$ {item.preco.toFixed(2)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-4 text-gray-900">{title}</Text>
      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center py-10">
          <Text className="text-gray-500 italic">{emptyMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};