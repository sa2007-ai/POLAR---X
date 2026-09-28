import { createContext } from 'react';
import type { PolarContextType } from './PolarContext';

export const PolarContext = createContext<PolarContextType | undefined>(undefined);
