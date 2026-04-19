import { Scenario } from "../types";
import { taxesScenario } from "./taxes";
import { leaseScenario } from "./lease";
import { jobScenario } from "./job";

export const SCENARIOS: Scenario[] = [taxesScenario, leaseScenario, jobScenario];

export const SCENARIO_MAP: Record<string, Scenario> = {
  taxes: taxesScenario,
  lease: leaseScenario,
  job: jobScenario,
};
