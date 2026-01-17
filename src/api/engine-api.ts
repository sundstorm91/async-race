import type { EngineStatus } from "../types";

interface EngineApi {
  // PATCH /engine?id=X&status=started
  startEngine(id: number): Promise<EngineStatus>;

  // PATCH /engine?id=X&status=stopped
  stopEngine(id: number): Promise<void>;

  // PATCH /engine?id=X&status=drive
  drive(id: number): Promise<{ success: boolean }>;
}