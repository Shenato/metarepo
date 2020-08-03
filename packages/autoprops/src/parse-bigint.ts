import BigInt from 'big-integer'
import type { BigInteger } from 'big-integer'
import { ALPHABET } from './alphabet'

export const parseBigInt = (intStr: string): BigInteger => {
  return BigInt(intStr, ALPHABET.length, ALPHABET, true)
}
