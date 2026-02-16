import { DelhiConfig } from "../configs/delhi.config";
import { BangaloreConfig } from "../configs/bangalore.config";
import { HyderabadConfig } from "../configs/hyderabad.config";
import { AhmedabadConfig } from "../configs/ahmedabad.config";
import { ChennaiConfig } from "../configs/chennai.config";
import { KolkataConfig } from "../configs/kolkata.config";
import { MumbaiConfig } from "../configs/mumbai.config";
import { PuneConfig } from "../configs/pune.config";


export const CityRegistry = {
  Delhi: {
    system: "UAV",
    config: DelhiConfig
  },
  Bangalore: {
    system: "UAV",
    config: BangaloreConfig
  },
  Hyderabad: {
    system: "UAV",
    config: HyderabadConfig
  },
  Ahmedabad: {
    system: "UAV",
    config: AhmedabadConfig
  },

  Chennai: {
    system: "ARV",
    config: ChennaiConfig
  },

  Kolkata: {
  system: "ARV",
  config: KolkataConfig
  },

  Mumbai: {
  system: "CVS",
  config: MumbaiConfig
},

Pune: {
  system: "CVS",
  config: PuneConfig
},

} as const;
