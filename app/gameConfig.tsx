import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { initializeGrid } from '../src/store/slices/gameSlice';

export default function GameConfigScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const startGame = (size: number, moves: number, level: 'easy'|'medium'|'hard') => {
    dispatch(initializeGrid({ size, moves, level }));
    router.push('/game');
  };

  return (
    <View className="flex-1 bg-wood-900 justify-center items-center p-6">
      <Text className="text-gold text-3xl font-extrabold mb-12">SEVİYE SEÇİMİ</Text>

      <View className="w-full max-w-sm space-y-6">
        <TouchableOpacity 
          className="bg-accent py-5 rounded-xl border-b-4 border-yellow-700"
          onPress={() => startGame(10, 25, 'easy')}
        >
          <Text className="text-white text-center text-xl font-bold">KOLAY SEVİYE</Text>
          <Text className="text-wood-900 text-center text-sm font-bold mt-1">10x10 Grid • 25 Hamle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-wood-600 py-5 rounded-xl border-b-4 border-wood-800"
          onPress={() => startGame(8, 20, 'medium')}
        >
          <Text className="text-white text-center text-xl font-bold">ORTA SEVİYE</Text>
          <Text className="text-wood-200 text-center text-sm mt-1">8x8 Grid • 20 Hamle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-wood-800 py-5 rounded-xl border-b-4 border-black"
          onPress={() => startGame(6, 15, 'hard')}
        >
          <Text className="text-white text-center text-xl font-bold">ZOR SEVİYE</Text>
          <Text className="text-wood-400 text-center text-sm mt-1">6x6 Grid • 15 Hamle</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity className="mt-12 bg-wood-700 px-6 py-3 rounded-full" onPress={() => router.back()}>
        <Text className="text-wood-200 font-bold text-lg">İptal</Text>
      </TouchableOpacity>
    </View>
  );
}
