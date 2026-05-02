import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../src/store';
import { resetUser } from '../src/store/slices/userSlice';
import { resetMarket } from '../src/store/slices/marketSlice';

export default function MainMenu() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  // Kullanıcı adı yoksa hoşgeldin ekranına yönlendir
  useEffect(() => {
    if (!user.username) {
      router.replace('/welcome');
    }
  }, [user.username]);

  const handleResetData = () => {
    Alert.alert(
      "Verileri Sıfırla",
      "Tüm oyun geçmişin, istatistiklerin ve ismin tamamen silinecektir. Bu işlem geri alınamaz. Emin misin?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Evet, Sıfırla", 
          style: "destructive",
          onPress: () => {
            dispatch(resetUser());
            dispatch(resetMarket());
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-wood-900 items-center justify-center p-6">
      {/* Sol Üst: Kullanıcı İsmi (Tıklanabilir) */}
      <TouchableOpacity 
        onPress={() => router.push('/welcome')}
        className="absolute top-12 left-6 px-4 py-2 bg-wood-800 rounded-full border border-wood-700 shadow-sm"
      >
        <Text className="text-gold text-sm font-bold uppercase tracking-tight">
          👤 {user.username || 'Misafir'}
        </Text>
      </TouchableOpacity>

      <Text className="text-gold text-5xl font-extrabold mb-12 tracking-widest text-center" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 }}>
        WORD{"\n"}CRUSH
      </Text>

      <View className="w-full max-w-sm space-y-4">
        {/* Yeni Oyun */}
        <TouchableOpacity 
          className="bg-accent py-5 rounded-2xl shadow-xl border-b-4 border-yellow-700 active:border-b-0 active:mt-1 active:mb-[-1px] transition-all"
          onPress={() => router.push('/gameConfig')}
        >
          <Text className="text-white text-center text-xl font-black italic">YENİ OYUN</Text>
        </TouchableOpacity>

        {/* Skor Tablosu */}
        <TouchableOpacity 
          className="bg-wood-700 py-4 rounded-xl shadow-lg border-b-4 border-wood-900 active:border-b-0 active:mt-1 active:mb-[-1px] transition-all"
          onPress={() => router.push('/scores')}
        >
          <Text className="text-wood-100 text-center text-lg font-bold">SKOR TABLOSU</Text>
        </TouchableOpacity>

        {/* Market */}
        <TouchableOpacity 
          className="bg-wood-700 py-4 rounded-xl shadow-lg border-b-4 border-wood-900 active:border-b-0 active:mt-1 active:mb-[-1px] transition-all"
          onPress={() => router.push('/market')}
        >
          <Text className="text-wood-100 text-center text-lg font-bold">MARKET</Text>
        </TouchableOpacity>
      </View>

      {/* Sağ Alt: Verileri Sıfırla */}
      <TouchableOpacity 
        onPress={handleResetData}
        className="absolute bottom-10 right-6 bg-red-900/30 p-3 rounded-full border border-red-800/50"
      >
        <Text className="text-red-400 text-[10px] font-bold uppercase tracking-tighter">VERİLERİ SIFIRLA</Text>
      </TouchableOpacity>
      
      <Text className="absolute bottom-4 text-wood-600 text-[10px]">v1.0.3 Stable Edition</Text>
    </View>
  );
}
