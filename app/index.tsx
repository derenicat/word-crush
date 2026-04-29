import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../src/store';

export default function MainMenu() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user);

  return (
    <View className="flex-1 bg-wood-900 items-center justify-center p-6">
      <View className="absolute top-12 left-6">
        <Text className="text-wood-200 text-lg font-bold">
          {user.username ? `Merhaba, ${user.username}` : 'Hoşgeldin, Misafir'}
        </Text>
      </View>

      <Text className="text-gold text-5xl font-extrabold mb-12 tracking-widest" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 }}>
        WORD CRUSH
      </Text>

      <View className="w-full max-w-sm space-y-4">
        {/* Yeni Oyun */}
        <TouchableOpacity 
          className="bg-accent py-4 rounded-xl shadow-lg border-b-4 border-wood-800 active:border-b-0 active:mt-1 active:mb-[-1px] transition-all"
          onPress={() => router.push('/gameConfig')}
        >
          <Text className="text-white text-center text-xl font-bold">YENİ OYUN</Text>
        </TouchableOpacity>

        {/* Skor Tablosu */}
        <TouchableOpacity 
          className="bg-wood-700 py-4 rounded-xl shadow-lg border-b-4 border-wood-900 active:border-b-0 active:mt-1 active:mb-[-1px] transition-all"
          onPress={() => router.push('/scores')}
        >
          <Text className="text-wood-100 text-center text-xl font-bold">SKOR TABLOSU</Text>
        </TouchableOpacity>

        {/* Market */}
        <TouchableOpacity 
          className="bg-wood-700 py-4 rounded-xl shadow-lg border-b-4 border-wood-900 active:border-b-0 active:mt-1 active:mb-[-1px] transition-all"
          onPress={() => router.push('/market')}
        >
          <Text className="text-wood-100 text-center text-xl font-bold">MARKET</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
