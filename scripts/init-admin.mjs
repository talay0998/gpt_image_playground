import { webcrypto, randomBytes } from 'node:crypto'

const [, , username, password] = process.argv
if (!username || !password) {
  console.error('用法：node scripts/init-admin.mjs <username> <password>')
  process.exit(1)
}

const iterations = 100000
const salt = randomBytes(16)
const key = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
const bits = await webcrypto.subtle.deriveBits(
  { name: 'PBKDF2', salt: new Uint8Array(salt), iterations, hash: 'SHA-256' },
  key,
  256,
)
console.log(`pbkdf2$${iterations}$${salt.toString('base64')}$${Buffer.from(bits).toString('base64')}`)