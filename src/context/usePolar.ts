import { useContext } from 'react';
import { PolarContext } from './polarContextInstance';

export const usePolar = () => {
  const context = useContext(PolarContext);
  if (!context) {
    throw new Error('usePolar must be used within a PolarProvider');
  }
  return context;
};
