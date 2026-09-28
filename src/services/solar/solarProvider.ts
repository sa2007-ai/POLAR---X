/**
 * POLAR-X Solar Activity Provider Interface
 */

import { SolarActivitySnapshot } from './solarTypes';

export interface SolarProvider {
  readonly name: string;
  readonly isSimulated: boolean;

  getCurrentSolarActivity(): Promise<SolarActivitySnapshot>;
}
