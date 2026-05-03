import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../src/store';
import { buyItem } from '../src/store/slices/marketSlice';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const SHOP_ITEMS = [
  { id: 'fish', name: 'Balık', desc: 'Rastgele harfleri yok eder.', price: 100, icon: <MaterialCommunityIcons name="fish" size={32} color="#FFC107" /> },
  { id: 'wheel', name: 'Tekerlek', desc: 'Seçili satır ve sütunu temizler.', price: 200, icon: <MaterialCommunityIcons name="tire" size={32} color="#FFC107" /> },
  { id: 'lollipop', name: 'Lolipop Kırıcı', desc: 'Sadece 1 harfi yok eder.', price: 75, icon: <MaterialCommunityIcons name="candy" size={32} color="#FFC107" /> },
  { id: 'swap', name: 'Serbest Değiştirme', desc: 'İki harfin yerini değiştirir.', price: 125, icon: <Ionicons name="swap-horizontal" size={32} color="#FFC107" /> },
  { id: 'shuffle', name: 'Harf Karıştırma', desc: 'Tüm gridi karıştırır.', price: 300, icon: <Ionicons name="shuffle" size={32} color="#FFC107" /> },
  { id: 'partyBooster', name: 'Parti Güçlendiricisi', desc: 'Tüm gridi yeniler.', price: 400, icon: <MaterialCommunityIcons name="party-popper" size={32} color="#FFC107" /> },
] as const;

export default function MarketScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const market = useSelector((state: RootState) => state.market);

  const handleBuy = (itemId: any, price: number, name: string) => {
    if (market.gold >= price) {
      dispatch(buyItem(itemId));
    } else {
      Alert.alert('Hata', 'Yeterli altınınız yok!');
    }
  };

  return (
    <View className="flex-1 bg-wood-900 p-6">
      <View className="flex-row justify-between items-center mb-8 mt-12">
        <Text className="text-gold text-3xl font-extrabold">MARKET</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-wood-700 px-4 py-2 rounded-lg">
          <Text className="text-wood-100 font-bold">Kapat</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-wood-800 rounded-2xl p-4 mb-6 border border-wood-600 flex-row justify-between items-center">
        <Text className="text-wood-200 text-lg font-bold">Mevcut Altın:</Text>
        <Text className="text-gold text-2xl font-extrabold">{market.gold} 🪙</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {SHOP_ITEMS.map((item) => (
          <View key={item.id} className="bg-wood-700 rounded-xl p-4 mb-4 flex-row items-center border-b-4 border-wood-800">
            <View className="w-12 items-center mr-4">
              {item.icon}
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">{item.name}</Text>
              <Text className="text-wood-300 text-sm pr-2">{item.desc}</Text>
              <Text className="text-wood-400 text-xs mt-1">Sahip Olunan: {market.inventory[item.id as keyof typeof market.inventory]}</Text>
            </View>
            <TouchableOpacity 
              className={`py-3 px-4 rounded-lg ml-2 ${market.gold >= item.price ? 'bg-accent' : 'bg-wood-600'}`}
              onPress={() => handleBuy(item.id, item.price, item.name)}
            >
              <Text className="text-white font-bold">{item.price} 🪙</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
