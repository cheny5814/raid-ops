import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { GAME_FACTS } from '../app/content/game-facts.ts'
const root = fileURLToPath(new URL('../', import.meta.url))
const result = spawnSync('swift', ['-module-cache-path', join(tmpdir(), 'raid-ops-share-module-cache'), 'scripts/generate-share.swift', JSON.stringify(GAME_FACTS)], { cwd: root, stdio: 'inherit' })
if (result.error) throw result.error
process.exitCode = result.status ?? 1
