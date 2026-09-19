import { readFile } from "node:fs/promises"
import path from "node:path"

export const statePath = path.join(process.cwd(), ".playwright", "v1-state.json")

export interface E2EState {
  password: string
  users: Record<"admin" | "student" | "teacher", { id: string; email: string }>
}

export async function readE2EState() {
  return JSON.parse(await readFile(statePath, "utf8")) as E2EState
}
