import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'out')
const branch = 'production'
const work = path.join(os.tmpdir(), `mstore-evening-production-${process.pid}`)

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('out/index.html is missing. Run npm run build first.')
  process.exit(1)
}

await rm(work, { recursive: true, force: true })

const remote = spawnSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', branch], {
  cwd: root,
  encoding: 'utf8',
})
if (remote.status === 0) {
  git(['fetch', 'origin', `${branch}:${branch}`])
}

let worktreeReady = false
try {
  if (spawnSync('git', ['rev-parse', '--verify', '--quiet', branch], { cwd: root }).status === 0) {
    git(['worktree', 'add', '--force', work, branch])
  } else {
    git(['worktree', 'add', '--detach', work])
    git(['checkout', '--orphan', branch], work)
  }
  worktreeReady = true
  git(['rm', '-rf', '.'], work, true)

  const copied = spawnSync('cp', ['-a', `${dist}/.`, `${work}/`], { stdio: 'inherit' })
  if (copied.status !== 0) process.exit(copied.status ?? 1)

  git(['add', '-A'], work)
  const dirty = spawnSync('git', ['status', '--porcelain'], { cwd: work, encoding: 'utf8' })
  if (dirty.status !== 0) process.exit(dirty.status ?? 1)
  if (!dirty.stdout.trim()) {
    console.log(`${branch} already matches out/`)
  } else {
    const source = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' })
    const sha = source.stdout.trim() || 'unknown'
    const identity =
      process.env.GITHUB_ACTIONS === 'true'
        ? [
            '-c',
            'user.name=github-actions[bot]',
            '-c',
            'user.email=41898282+github-actions[bot]@users.noreply.github.com',
          ]
        : []
    git([...identity, 'commit', '-m', `Publish the static site from ${sha}.`], work)
    console.log(`Updated ${branch} from ${sha}.`)
  }
} finally {
  if (worktreeReady) spawnSync('git', ['worktree', 'remove', '--force', work], { cwd: root })
  await rm(work, { recursive: true, force: true })
}

function git(args, cwd = root, allowFailure = false) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (!allowFailure && result.status !== 0) process.exit(result.status ?? 1)
  return result
}
