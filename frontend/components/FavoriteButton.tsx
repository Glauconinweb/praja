import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FavoriteButtonProps {
  isFavorited: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  isFavorited, 
  onPress, 
  size = 24, 
  color = "#FF4B4B" 
}) => {
  return (
    <TouchableOpacity onPress={onPress} className="p-2">
      <Ionicons 
        name={isFavorited ? "heart" : "heart-outline"} 
        size={size} 
        color={isFavorited ? color : "#666"} 
      />
    </TouchableOpacity>
  );
};