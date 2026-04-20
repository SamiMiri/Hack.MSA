import { Scenario } from "../types";
import { taxesScenario } from "./taxes";
import { leaseScenario } from "./lease";
import { jobScenario } from "./job";
import { dealershipScenario } from "./dealership";
import { hospitalScenario } from "./hospital";

export const SCENARIOS: Scenario[] = [
  taxesScenario,
  leaseScenario,
  jobScenario,
  dealershipScenario,
  hospitalScenario,
];

export const SCENARIO_MAP: Record<string, Scenario> = {
  taxes: taxesScenario,
  lease: leaseScenario,
  job: jobScenario,
  dealership: dealershipScenario,
  hospital: hospitalScenario,
};
