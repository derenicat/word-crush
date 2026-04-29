import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { initializeGrid } from '../src/store/slices/gameSlice';

export default function GameConfigScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [selectedMoves, setSelectedMoves] = useState(25);

  const startGame = (size: number, level: 'easy'|'medium'|'hard') => {
    dispatch(initializeGrid({ size, moves: selectedMoves, level }));
    router.push('/game');
  };

  return (
    <View className="flex-1 bg-wood-900 justify-center items-center p-6">
      <Text className="text-gold text-3xl font-extrabold mb-8">OYUN AYARLARI</Text>

      <Text className="text-white text-lg font-bold mb-4">Hamle Sayısı</Text>
      <View className="flex-row justify-center gap-4 mb-10">
        {[25, 20, 15].map(moves => (
          <TouchableOpacity 
            key={moves}
            onPress={() => setSelectedMoves(moves)}
            className={`px-6 py-3 rounded-xl border-2 ${selectedMoves === moves ? 'bg-gold border-yellow-600' : 'bg-wood-700 border-wood-500'}`}
          >
            <Text className={`font-bold text-lg ${selectedMoves === moves ? 'text-wood-900' : 'text-white'}`}>{moves}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-white text-lg font-bold mb-4">Tahta Boyutu (Zorluk)</Text>
      <View className="w-full max-w-sm space-y-4">
        <TouchableOpacity 
          className="bg-accent py-4 rounded-xl border-b-4 border-yellow-700"
          onPress={() => startGame(10, 'easy')}
        >
          <Text className="text-white text-center text-xl font-bold">KOLAY SEVİYE</Text>
          <Text className="text-wood-900 text-center text-sm font-bold mt-1">10x10 Grid</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-wood-600 py-4 rounded-xl border-b-4 border-wood-800"
          onPress={() => startGame(8, 'medium')}
        >
          <Text className="text-white text-center text-xl font-bold">ORTA SEVİYE</Text>
          <Text className="text-wood-200 text-center text-sm mt-1">8x8 Grid</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-wood-800 py-4 rounded-xl border-b-4 border-black"
          onPress={() => startGame(6, 'hard')}
        >
          <Text className="text-white text-center text-xl font-bold">ZOR SEVİYE</Text>
          <Text className="text-wood-400 text-center text-sm mt-1">6x6 Grid</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity className="mt-12 bg-wood-700 px-6 py-3 rounded-full" onPress={() => router.back()}>
        <Text className="text-wood-200 font-bold text-lg">İptal</Text>
      </TouchableOpacity>
    </View>
  );
}
