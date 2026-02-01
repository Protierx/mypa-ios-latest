import { useState, useCallback } from 'react';

export const useProofCameraData = (navigation?: any) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapture = useCallback(() => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      navigation?.navigate('ProofConfirm');
    }, 500);
  }, [navigation]);

  return {
    isCapturing,
    handleCapture,
  };
};
