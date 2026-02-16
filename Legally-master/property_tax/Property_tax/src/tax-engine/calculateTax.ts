import { CityRegistry } from "./cityRegistry";
import { calculateUAV } from "./engines/uav.engine";
import { calculateARV } from "./engines/arv.engine";
import { calculateCVS } from "./engines/cvs.engine";
import {
  type PropertyTaxInput,
  isUAVInput,
  isARVInput,
  isCVSInput,
} from "./types";

export function calculatePropertyTax(
  input: PropertyTaxInput
) {
  const cityConfig = CityRegistry[input.city];

  if (!cityConfig) {
    throw new Error("City not supported");
  }

  switch (cityConfig.system) {
    case "UAV":
      if (!isUAVInput(input)) {
        throw new Error("Invalid UAV input");
      }
      return calculateUAV(input, cityConfig.config);

    case "ARV":
      if (!isARVInput(input)) {
        throw new Error("Invalid ARV input");
      }
      return calculateARV(input, cityConfig.config);

    case "CVS":
      if(!isCVSInput(input)){
        throw new Error("");
      }
      return calculateCVS(input, cityConfig.config);
  }
}
