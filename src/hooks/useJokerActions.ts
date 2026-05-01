import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { consumeItem } from '../store/slices/marketSlice';
import { applyJoker, shuffleGrid } from '../store/slices/gameSlice';
import { LetterGenerator } from '../engine/LetterGenerator';

export type TargetedJokerType = 'lollipop' | 'wheel' | 'swap' | null;

export const useJokerActions = () => {
  const dispatch = useDispatch();
  const inventory = useSelector((state: RootState) => state.market.inventory);
  
  const [activeJoker, setActiveJoker] = useState<TargetedJokerType>(null);
  const [swapTarget, setSwapTarget] = useState<{row: number, col: number} | null>(null);

  const handleInstantJoker = (type: 'fish' | 'shuffle' | 'partyBooster') => {
    if (inventory[type] > 0) {
      dispatch(consumeItem(type));
      
      if (type === 'shuffle') {
        dispatch(shuffleGrid());
      } else if (type === 'fish' || type === 'partyBooster') {
        const newLetters = Array(100).fill(0).map(() => LetterGenerator.getRandomLetter());
        dispatch(applyJoker({ type, newLetters }));
      }
    }
  };

  const activateTargetedJoker = (type: 'lollipop' | 'wheel' | 'swap') => {
    if (inventory[type] > 0) {
      setActiveJoker(type);
      setSwapTarget(null);
    }
  };

  const cancelJoker = () => {
    setActiveJoker(null);
    setSwapTarget(null);
  };

  const executeTargetedJoker = (row: number, col: number) => {
    if (!activeJoker) return;

    if (activeJoker === 'swap') {
        if (!swapTarget) {
            setSwapTarget({row, col});
        } else {
            // Eğer aynı hücreye tıkladıysa iptal et
            if (swapTarget.row === row && swapTarget.col === col) {
                setSwapTarget(null);
                return;
            }
            dispatch(consumeItem(activeJoker));
            const newLetters = Array(20).fill(0).map(() => LetterGenerator.getRandomLetter());
            dispatch(applyJoker({ type: activeJoker, targetRow: swapTarget.row, targetCol: swapTarget.col, targetRow2: row, targetCol2: col, newLetters }));
            setActiveJoker(null);
            setSwapTarget(null);
        }
    } else {
        dispatch(consumeItem(activeJoker)); // Envanterden düş
        const newLetters = Array(20).fill(0).map(() => LetterGenerator.getRandomLetter());
        dispatch(applyJoker({ type: activeJoker, targetRow: row, targetCol: col, newLetters }));
        setActiveJoker(null); // Moddan çık
    }
  };

  return {
    activeJoker,
    swapTarget,
    handleInstantJoker,
    activateTargetedJoker,
    cancelJoker,
    executeTargetedJoker
  };
};
