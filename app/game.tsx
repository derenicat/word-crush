import React, { useEffect } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../src/store';
import { selectCell, processValidWord, invalidWordAttempt, updateAvailableWords } from '../src/store/slices/gameSlice';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Trie } from '../src/engine/Trie';
import { LetterGenerator, LETTER_SCORES } from '../src/engine/LetterGenerator';
import { DFSEngine } from '../src/engine/DFSEngine';
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
      top: withSpring(cellData.row * size, { damping: 15, stiffness: 120 }),
      left: withSpring(cellData.col * size, { damping: 15, stiffness: 120 }),
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

  const gridSize = game.grid.length;
  if(gridSize === 0) return null;
  const cellSize = BOARD_SIZE / gridSize;

  // Grid her güncellendiğinde kelimeleri tara
  useEffect(() => {
    if (gridSize > 0) {
      // ID gridini harf gridine çevir (RaycastEngine harf bekler)
      const letterGrid = game.grid.map(row => 
        row.map(id => id ? (game.cells[id]?.letter || '') : '')
      );
      
      const foundWords = engine.findAllWords(letterGrid);
      const nonOverlappingCount = engine.calculateNonOverlappingCount(foundWords);
      
      console.log(`\n--- [DFS ENGINE] TAHTA ANALİZİ (BOGGLE KURALLARI) ---`);
      console.log(`Olası toplam kelime: ${foundWords.length}`);
      
      // En uzun 5 kelimeyi logla
      foundWords.sort((a,b) => b.text.length - a.text.length).slice(0, 5).forEach(w => {
         console.log(`- ${w.text} (${w.path.length} harf)`);
      });
      
      console.log(`Çakışmadan patlatılabilecek (Greedy Max) kelime sayısı: ${nonOverlappingCount}`);
      console.log(`--------------------------------------\n`);
      
      dispatch(updateAvailableWords(nonOverlappingCount));
    }
  }, [game.grid]);

  const selectedText = game.selectedIds.map(id => game.cells[id]?.letter || '').join('');

  const selectCellAction = (x: number, y: number) => {
    // Deadzone kontrolü: Parmağın hücrenin orta %50'lik alanına girmesini bekle
    const relativeX = x % cellSize;
    const relativeY = y % cellSize;
    const margin = cellSize * 0.25;

    if (relativeX > margin && relativeX < cellSize - margin &&
        relativeY > margin && relativeY < cellSize - margin) {
        
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        
        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
          dispatch(selectCell(game.grid[row][col]));
        }
    }
  };

  const validateWordAction = () => {
    const text = game.selectedIds.map(id => game.cells[id]?.letter || '').join('');
    if (text.length >= 3 && globalTrie.search(text)) {
      const score = text.split('').reduce((acc, char) => acc + (LETTER_SCORES[char] || 1), 0);
      // Zincirleme patlamalara karşı güvenli liman: 100 rastgele harf yolluyoruz.
      const newLetters = Array(100).fill(0).map(() => LetterGenerator.getRandomLetter());
      dispatch(processValidWord({ wordScore: score, newLetters }));
    } else {
      if(text.length > 0) dispatch(invalidWordAttempt());
    }
  };

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      runOnJS(selectCellAction)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(selectCellAction)(e.x, e.y);
    })
    .onEnd(() => {
      runOnJS(validateWordAction)();
    });

  const handleQuit = () => {
    Alert.alert('Çıkış', 'Oyundan çıkmak istediğinize emin misiniz?', [
      { text: 'Hayır', style: 'cancel' },
      { text: 'Evet', style: 'destructive', onPress: () => router.back() }
    ]);
  };

  return (
    <View className="flex-1 bg-wood-900 pt-16 px-4">
      <View className="flex-row justify-between items-center mb-4 bg-wood-800 p-4 rounded-2xl border border-wood-700">
        <View>
          <Text className="text-wood-300 font-bold text-xs uppercase tracking-wider">Puan</Text>
          <Text className="text-gold text-3xl font-extrabold">{game.score}</Text>
        </View>
        <View className="items-center">
          <Text className="text-wood-300 font-bold text-xs uppercase tracking-wider">Seçilen</Text>
          <Text className="text-white text-xl font-bold tracking-widest">{selectedText || '-'}</Text>
        </View>
        <View className="items-end">
          <Text className="text-wood-300 font-bold text-xs uppercase tracking-wider">Hamle</Text>
          <Text className="text-accent text-3xl font-extrabold">{game.movesLeft}</Text>
        </View>
      </View>

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

      <TouchableOpacity className="mb-8 items-center" onPress={handleQuit}>
        <Text className="text-wood-400 font-bold text-lg">Oyunu Bitir</Text>
      </TouchableOpacity>
    </View>
  );
}
