import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../src/store';
import { selectCell, processValidWord, invalidWordAttempt, resetSelection, updateAvailableWords } from '../src/store/slices/gameSlice';
import { updateStatsAfterGame } from '../src/store/slices/userSlice';
import { addGold } from '../src/store/slices/marketSlice';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Trie } from '../src/engine/Trie';
import { LetterGenerator, LETTER_SCORES } from '../src/engine/LetterGenerator';
import { DFSEngine } from '../src/engine/DFSEngine';
import { useJokerActions } from '../src/hooks/useJokerActions';
import dictionary from '../assets/dictionary.json';

const { width } = Dimensions.get('window');
const BOARD_SIZE = width - 32;

// 48.000+ kelimelik gerçek Türkçe sözlük yükleniyor
const globalTrie = new Trie();
globalTrie.loadDictionary(dictionary as string[]);
const engine = new DFSEngine(globalTrie);

const POWER_UP_ICONS = {
  row: '⇆',
  col: '⇅',
  area: '✹',
  mega: '✪',
};

const Cell = React.memo(({ id, size }: { id: string; size: number }) => {
  const cellData = useSelector((state: RootState) => state.game.cells[id]);
  if (!cellData) return null;

  const isSelected = cellData.status === 'selected';

  const animatedStyle = useAnimatedStyle(() => {
    return {
      top: withSpring(4 + cellData.row * size, { damping: 15, stiffness: 120 }),
      left: withSpring(4 + cellData.col * size, { damping: 15, stiffness: 120 }),
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', width: size, height: size, padding: 2 }, animatedStyle]}>
      <View 
        className={`flex-1 rounded-lg items-center justify-center border-b-4 ${
          isSelected ? 'bg-gold border-yellow-600' : 'bg-wood-100 border-wood-300'
        }`}
      >
        <Text className={`font-extrabold text-2xl ${isSelected ? 'text-white' : 'text-wood-900'}`}>
          {cellData.letter}
        </Text>
        {cellData.powerUp && (
          <View className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">{POWER_UP_ICONS[cellData.powerUp]}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

export default function GameScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const game = useSelector((state: RootState) => state.game);
  const inventory = useSelector((state: RootState) => state.market.inventory);
  
  const { activeJoker, swapTarget, handleInstantJoker, activateTargetedJoker, cancelJoker, executeTargetedJoker } = useJokerActions();
  const [isLogVisible, setIsLogVisible] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (!isGameOver) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGameOver]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const endGame = () => {
    if (isGameOver) return;
    setIsGameOver(true);
    let longest = '';
    let totalWords = 0;
    game.moveLogs.forEach(log => {
      totalWords += log.comboWords.length;
      log.comboWords.forEach(w => {
         if (w.length > longest.length) longest = w;
      });
    });
    
    const duration = Math.max(1, Math.round((Date.now() - game.gameStartTime) / 60000));
    
    dispatch(updateStatsAfterGame({
      score: game.score,
      wordsFound: totalWords,
      longest: longest,
      duration: duration,
      gridSize: `${gridSize}x${gridSize}`
    }));
    
    dispatch(addGold(game.score));
  };

  useEffect(() => {
    if (game.movesLeft <= 0 && !isGameOver && game.grid.length > 0) {
      endGame();
    }
  }, [game.movesLeft]);

  const gridSize = game.grid.length;
  const cellSize = gridSize > 0 ? (BOARD_SIZE - 8) / gridSize : 0;

  // Grid her güncellendiğinde kelimeleri tara
  useEffect(() => {
    if (gridSize > 0) {
      // ID gridini harf gridine çevir (RaycastEngine harf bekler)
      const letterGrid = game.grid.map(row => 
        row.map(id => id ? (game.cells[id]?.letter || '') : '')
      );
      
      const foundWords = engine.findAllWords(letterGrid);
      const uniqueWords = Array.from(new Set(foundWords.map(w => w.text)))
        .map(text => {
          const original = foundWords.find(w => w.text === text);
          return { text, length: original?.path.length || 0 };
        })
        .sort((a, b) => b.length - a.length);

      const nonOverlappingCount = engine.calculateNonOverlappingCount(foundWords);
      
      let logMessage = `\n--- [DFS ENGINE] TAHTA ANALİZİ ---\n`;
      logMessage += `Toplam Varyasyon: ${foundWords.length}\n`;
      logMessage += `Benzersiz Kelime: ${uniqueWords.length}\n`;
      logMessage += `En Uzunlar:\n`;
      uniqueWords.slice(0, 5).forEach(w => {
         logMessage += `  - ${w.text} (${w.length} harf)\n`;
      });
      logMessage += `Çakışmasız Max: ${nonOverlappingCount}\n`;
      logMessage += `----------------------------------\n`;
      
      console.log(logMessage);
      
      dispatch(updateAvailableWords(nonOverlappingCount));
    }
  }, [game.grid]);

  const selectedText = game.selectedIds.map(id => game.cells[id]?.letter || '').join('');

  const selectCellAction = (x: number, y: number) => {
    const adjustedX = x - 4;
    const adjustedY = y - 4;
    
    // Deadzone kontrolü: Parmağın hücrenin orta %50'lik alanına girmesini bekle
    const relativeX = adjustedX % cellSize;
    const relativeY = adjustedY % cellSize;
    const margin = cellSize * 0.25;

    if (relativeX > margin && relativeX < cellSize - margin &&
        relativeY > margin && relativeY < cellSize - margin) {
        
        const col = Math.floor(adjustedX / cellSize);
        const row = Math.floor(adjustedY / cellSize);
        
        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
          dispatch(selectCell(game.grid[row][col]));
        }
    }
  };

  const validateWordAction = () => {
    if (activeJoker) return;

    const text = game.selectedIds.map(id => game.cells[id]?.letter || '').join('');
    
    if (text.length >= 3 && globalTrie.search(text)) {
      // ... (existing logic)
      const comboWordsSet = new Set<string>();
      for (let i = 0; i <= text.length - 3; i++) {
        for (let j = i + 3; j <= text.length; j++) {
          const sub = text.substring(i, j);
          if (globalTrie.search(sub)) {
            comboWordsSet.add(sub);
          }
        }
      }

      const comboWords = Array.from(comboWordsSet);
      let totalScore = 0;
      comboWords.forEach(w => {
         totalScore += w.split('').reduce((acc, char) => acc + (LETTER_SCORES[char] || 1), 0);
      });
      
      const newLetters = Array(100).fill(0).map(() => LetterGenerator.getRandomLetter());
      dispatch(processValidWord({ wordText: text, comboWords, wordScore: totalScore, newLetters }));
    } else {
      if (text.length >= 2) {
        dispatch(invalidWordAttempt());
      } else if (text.length === 1) {
        dispatch(resetSelection());
      }
    }
  };

  const handleGestureBegin = (x: number, y: number) => {
    const adjustedX = x - 4;
    const adjustedY = y - 4;
    const col = Math.floor(adjustedX / cellSize);
    const row = Math.floor(adjustedY / cellSize);
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      if (activeJoker) {
        executeTargetedJoker(row, col);
      } else {
        selectCellAction(x, y);
      }
    }
  };

  const handleGestureUpdate = (x: number, y: number) => {
    if (!activeJoker) {
      selectCellAction(x, y);
    }
  };

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      runOnJS(handleGestureBegin)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(handleGestureUpdate)(e.x, e.y);
    })
    .onEnd(() => {
      runOnJS(validateWordAction)();
    });

  const handleQuit = () => {
    Alert.alert('Çıkış', 'Oyundan çıkmak istediğinize emin misiniz? (Mevcut puanınız ve altınlarınız kaydedilecek)', [
      { text: 'Hayır', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: () => endGame() }
    ]);
  };

  if (gridSize === 0) return null;

  return (
    <View className="flex-1 bg-wood-900 pt-16 px-4">
      <View className="flex-row justify-between items-center mb-4 px-4 w-full">
        <View className="flex-row items-center space-x-4 gap-4">
          <View>
            <Text className="text-white text-lg font-bold">Puan: {game.score}</Text>
            <Text className="text-wood-400 font-bold">Hamle: {game.movesLeft}</Text>
            <Text className="text-wood-500 text-xs font-bold">Süre: {formatTime(seconds)}</Text>
          </View>
          <TouchableOpacity onPress={() => setIsLogVisible(true)} className="bg-wood-700 px-3 py-2 rounded-lg border border-wood-500">
            <Text className="text-white font-bold">📜 Log</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleQuit} className="bg-red-500 px-4 py-2 rounded-lg">
          <Text className="text-white font-bold">Çıkış</Text>
        </TouchableOpacity>
      </View>

      {/* GAME OVER MODAL */}
      <Modal visible={isGameOver} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/80 p-6">
          <View className="bg-wood-800 w-full max-w-sm rounded-3xl p-6 border-4 border-gold items-center">
            <Text className="text-gold text-4xl font-extrabold mb-2">OYUN BİTTİ</Text>
            <Text className="text-white text-lg mb-6">Tebrikler!</Text>
            
            <View className="bg-wood-900 w-full rounded-xl p-4 mb-6 border-2 border-wood-700">
               <Text className="text-wood-300 text-center mb-1">Kazanılan Puan</Text>
               <Text className="text-white text-4xl font-bold text-center mb-4">{game.score}</Text>
               
               <Text className="text-wood-300 text-center mb-1">Kazanılan Altın</Text>
               <Text className="text-gold text-3xl font-bold text-center">{game.score} 🪙</Text>
            </View>
            
            <TouchableOpacity 
              className="bg-gold px-8 py-4 rounded-full w-full border-b-4 border-yellow-700"
              onPress={() => {
                setIsGameOver(false);
                router.replace('/');
              }}
            >
              <Text className="text-wood-900 text-xl font-bold text-center">Ana Menüye Dön</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LOG MODAL */}
      <Modal visible={isLogVisible} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/70 p-6">
          <View className="bg-wood-800 w-full rounded-2xl p-4 border-2 border-wood-600 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold text-center">📜 Hamle Geçmişi</Text>
              <TouchableOpacity onPress={() => setIsLogVisible(false)} className="bg-red-500 px-3 py-1 rounded">
                <Text className="text-white font-bold">X</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {game.moveLogs.length === 0 ? (
                <Text className="text-wood-400 text-center py-4">Henüz bir hamle yapılmadı.</Text>
              ) : (
                game.moveLogs.map((log, index) => (
                  <View key={index} className="bg-wood-700 p-3 rounded-lg mb-2 border border-wood-500">
                    <Text className="text-white font-bold text-lg">{log.word} ({log.comboWords.length}x Combo)</Text>
                    <Text className="text-wood-300 text-sm">Bulunanlar: {log.comboWords.join(', ')}</Text>
                    <Text className="text-gold font-bold mt-1">Puan: +{log.score}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* JOKER UYARI ALANI */}
      {activeJoker && (
        <View className="bg-red-500 w-full p-2 mb-2 items-center rounded-lg flex-row justify-between">
          <Text className="text-white font-bold">
            Hedef Seçin ({activeJoker === 'lollipop' ? 'Lolipop 🍭' : activeJoker === 'wheel' ? 'Tekerlek 🎡' : swapTarget ? '2. Hücre 🔄' : '1. Hücre 🔄'})
          </Text>
          <TouchableOpacity onPress={cancelJoker} className="bg-white px-2 py-1 rounded">
            <Text className="text-red-500 font-bold">İptal</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="items-center justify-center flex-1">
        <GestureDetector gesture={panGesture}>
          <View 
            style={{ width: BOARD_SIZE, height: BOARD_SIZE }} 
            className="bg-wood-800 rounded-2xl p-0 border-4 border-wood-700 shadow-xl overflow-hidden relative"
          >
            {Object.values(game.cells).map((cell) => (
              <Cell key={cell.id} id={cell.id} size={cellSize} />
            ))}
          </View>
        </GestureDetector>
      </View>

      {/* JOKER BAR */}
      <View className="w-full mt-6 mb-8">
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 12, gap: 12 }}>
          <TouchableOpacity 
            className={`bg-wood-200 p-3 rounded-xl items-center justify-center border-b-4 border-wood-400 min-w-[60px] ${inventory.lollipop === 0 ? 'opacity-50' : ''}`}
            onPress={() => activateTargetedJoker('lollipop')}
          >
            <Text className="text-2xl">🍭</Text>
            <View className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full items-center justify-center"><Text className="text-white text-xs font-bold">{inventory.lollipop}</Text></View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`bg-wood-200 p-3 rounded-xl items-center justify-center border-b-4 border-wood-400 min-w-[60px] ${inventory.wheel === 0 ? 'opacity-50' : ''}`}
            onPress={() => activateTargetedJoker('wheel')}
          >
            <Text className="text-2xl">🎡</Text>
            <View className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full items-center justify-center"><Text className="text-white text-xs font-bold">{inventory.wheel}</Text></View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`bg-wood-200 p-3 rounded-xl items-center justify-center border-b-4 border-wood-400 min-w-[60px] ${inventory.swap === 0 ? 'opacity-50' : ''}`}
            onPress={() => activateTargetedJoker('swap')}
          >
            <Text className="text-2xl">🔄</Text>
            <View className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full items-center justify-center"><Text className="text-white text-xs font-bold">{inventory.swap}</Text></View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`bg-wood-200 p-3 rounded-xl items-center justify-center border-b-4 border-wood-400 min-w-[60px] ${inventory.partyBooster === 0 ? 'opacity-50' : ''}`}
            onPress={() => handleInstantJoker('partyBooster')}
          >
            <Text className="text-2xl">🎆</Text>
            <View className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full items-center justify-center"><Text className="text-white text-xs font-bold">{inventory.partyBooster}</Text></View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`bg-wood-200 p-3 rounded-xl items-center justify-center border-b-4 border-wood-400 min-w-[60px] ${inventory.fish === 0 ? 'opacity-50' : ''}`}
            onPress={() => handleInstantJoker('fish')}
          >
            <Text className="text-2xl">🐟</Text>
            <View className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full items-center justify-center"><Text className="text-white text-xs font-bold">{inventory.fish}</Text></View>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`bg-wood-200 p-3 rounded-xl items-center justify-center border-b-4 border-wood-400 min-w-[60px] ${inventory.shuffle === 0 ? 'opacity-50' : ''}`}
            onPress={() => handleInstantJoker('shuffle')}
          >
            <Text className="text-2xl">🔀</Text>
            <View className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full items-center justify-center"><Text className="text-white text-xs font-bold">{inventory.shuffle}</Text></View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}
