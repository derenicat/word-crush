import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../src/store';

export default function ScoresScreen() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user);

  return (
    <View className="flex-1 bg-wood-900 p-6">
      <View className="flex-row justify-between items-center mb-8 mt-12">
        <Text className="text-gold text-3xl font-extrabold">SKOR TABLOSU</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-wood-700 px-4 py-2 rounded-lg">
          <Text className="text-wood-100 font-bold">Kapat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-wood-800 rounded-2xl p-6 mb-6 border-2 border-wood-700">
          <Text className="text-wood-100 text-lg font-bold mb-4 border-b border-wood-700 pb-2">Genel Performans</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-wood-300">Toplam Oyun:</Text>
            <Text className="text-white font-bold">{user.totalGamesPlayed}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-wood-300">En Yüksek Puan:</Text>
            <Text className="text-accent font-bold">{user.highestScore}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-wood-300">Ortalama Puan:</Text>
            <Text className="text-white font-bold">{Math.round(user.averageScore)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-wood-300">Toplam Kelime:</Text>
            <Text className="text-white font-bold">{user.totalWordsFound}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-wood-300">En Uzun Kelime:</Text>
            <Text className="text-gold font-bold">{user.longestWord || '-'}</Text>
          </View>
        </View>

        <Text className="text-wood-200 font-bold mb-4 ml-2">Geçmiş Oyunlar</Text>
        {(user.pastGames || []).length === 0 ? (
          <Text className="text-wood-400 text-center mt-4 mb-10">Henüz hiç oyun oynamadın.</Text>
        ) : (
          (user.pastGames || []).map((game, index) => (
            <View key={game.id || index} className="bg-wood-800 rounded-xl p-4 border border-wood-700 mb-3 flex-row justify-between items-center">
               <View>
                 <Text className="text-white font-bold">{game.date}</Text>
                 <Text className="text-wood-400 text-xs mt-1">{game.wordsFound} Kelime</Text>
               </View>
               <View className="items-end">
                 <Text className="text-gold font-bold text-lg">{game.score} Puan</Text>
                 <Text className="text-wood-400 text-xs mt-1">{game.level}</Text>
               </View>
            </View>
          ))
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
