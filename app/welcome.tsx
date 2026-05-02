import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { setUsername } from '../src/store/slices/userSlice';
import { RootState } from '../src/store';

export default function WelcomeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const existingUsername = useSelector((state: RootState) => state.user.username);
  const [name, setName] = useState(existingUsername || '');

  const handleContinue = () => {
    if (name.trim().length < 2) return;
    dispatch(setUsername(name.trim()));
    router.replace('/');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1 bg-wood-900"
      >
        <View className="flex-1 justify-center px-8">
          <View className="items-center mb-12">
             <View className="w-24 h-24 bg-gold rounded-3xl items-center justify-center rotate-12 mb-6">
                <Text className="text-wood-900 text-5xl font-black">W</Text>
             </View>
             <Text className="text-gold text-4xl font-black tracking-widest">WORD CRUSH</Text>
             <Text className="text-wood-400 mt-2 text-center">Maceraya başlamadan önce ismini öğrenelim</Text>
          </View>

          <View className="bg-wood-800 p-6 rounded-3xl border-2 border-wood-700 shadow-2xl">
            <Text className="text-wood-200 font-bold mb-4 ml-1">Kullanıcı Adın</Text>
            <TextInput
              className="bg-wood-900 text-white p-4 rounded-xl border border-wood-600 text-lg font-bold"
              placeholder="İsim giriniz..."
              placeholderTextColor="#7a634a"
              value={name}
              onChangeText={setName}
              maxLength={15}
              autoFocus
            />
            
            <TouchableOpacity 
              onPress={handleContinue}
              disabled={name.trim().length < 2}
              className={`mt-6 p-4 rounded-xl items-center shadow-lg ${
                name.trim().length < 2 ? 'bg-wood-700 opacity-50' : 'bg-gold'
              }`}
            >
              <Text className="text-wood-900 font-black text-lg">DEVAM ET</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-wood-500 text-center mt-12 text-xs">
            © 2026 Word Crush • Tüm Hakları Saklıdır
          </Text>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
