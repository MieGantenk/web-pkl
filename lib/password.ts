const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*+-=?";

const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function randomIndex(max: number) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % max;
}

function pick(chars: string) {
  return chars[randomIndex(chars.length)];
}

/**
 * Kata sandi acak dengan huruf besar, huruf kecil, angka, dan simbol.
 * Dipakai admin saat membuat akun atau mengatur ulang kata sandi.
 */
export function generateSecurePassword(length = 16) {
  const size = Math.max(8, Math.min(72, Math.trunc(length)));
  const chars = [
    pick(UPPER),
    pick(LOWER),
    pick(DIGITS),
    pick(SYMBOLS),
  ];

  while (chars.length < size) {
    chars.push(pick(ALL));
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }

  return chars.join("");
}
