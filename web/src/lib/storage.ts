import type { Project } from "../types";
import { normalizeCustomerLayout } from "./customerLayout";
import { ensureEntranceCircuit } from "./electrical";

const STORAGE_KEY = "martinho-electrical-planner-project";
const BACKUP_STORAGE_KEY = "martinho-electrical-planner-project-backup";
const STORAGE_VERSION = 2;
const DEFAULT_SCALE_M_PER_UNIT = 1;

interface StoredProjectEnvelope {
  version: number;
  savedAt: string;
  project: Project;
}

export interface LocalProjectInfo {
  version: number;
  savedAt: string;
  backupSavedAt?: string;
}

export function loadLocalProject(fallback: Project): Project {
  const saved = readStorage(STORAGE_KEY);
  if (!saved) return normalizeProject(fallback, fallback);

  return readProject(saved, fallback) ?? readProject(readStorage(BACKUP_STORAGE_KEY), fallback) ?? normalizeProject(fallback, fallback);
}

export function parseProjectJson(raw: string, fallback: Project): Project | undefined {
  return readProject(raw, fallback);
}

export function saveLocalProject(project: Project): void {
  const previous = readStorage(STORAGE_KEY);
  if (previous) writeStorage(BACKUP_STORAGE_KEY, previous);

  const envelope: StoredProjectEnvelope = {
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    project: normalizeProject(project, project)
  };

  writeStorage(STORAGE_KEY, JSON.stringify(envelope));
}

export function clearLocalProject(): void {
  removeStorage(STORAGE_KEY);
}

export function getLocalProjectInfo(): LocalProjectInfo | undefined {
  const current = readEnvelope(readStorage(STORAGE_KEY));
  if (!current) return undefined;

  const backup = readEnvelope(readStorage(BACKUP_STORAGE_KEY));
  return {
    version: current.version,
    savedAt: current.savedAt,
    backupSavedAt: backup?.savedAt
  };
}

function readProject(raw: string | null, fallback: Project): Project | undefined {
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as unknown;
    const project = isEnvelope(parsed) ? parsed.project : parsed;
    if (!isProjectLike(project)) return undefined;
    return normalizeProject(project as Project, fallback);
  } catch {
    return undefined;
  }
}

function readEnvelope(raw: string | null): StoredProjectEnvelope | undefined {
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isEnvelope(parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function normalizeProject(project: Project, fallback: Project): Project {
  const meta = project.meta ?? fallback.meta;
  return normalizeCustomerLayout(ensureEntranceCircuit({
    ...fallback,
    ...project,
    meta: {
      ...fallback.meta,
      ...meta,
      scaleMPerUnit: positiveNumber(meta.scaleMPerUnit, fallback.meta.scaleMPerUnit || DEFAULT_SCALE_M_PER_UNIT),
      scaleVerified: typeof meta.scaleVerified === "boolean" ? meta.scaleVerified : false
    },
    rooms: Array.isArray(project.rooms) ? project.rooms : fallback.rooms,
    points: Array.isArray(project.points) ? project.points : fallback.points,
    circuits: Array.isArray(project.circuits) ? project.circuits : fallback.circuits
  }));
}

function isEnvelope(value: unknown): value is StoredProjectEnvelope {
  return isRecord(value) && typeof value.version === "number" && typeof value.savedAt === "string" && isProjectLike(value.project);
}

function isProjectLike(value: unknown): value is Project {
  return isRecord(value) && isRecord(value.meta) && Array.isArray(value.rooms) && Array.isArray(value.points) && Array.isArray(value.circuits);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function positiveNumber(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value !== undefined && value > 0 ? value : fallback;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Browsers can block localStorage in private or restricted contexts.
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing else to clear when storage access is blocked.
  }
}
