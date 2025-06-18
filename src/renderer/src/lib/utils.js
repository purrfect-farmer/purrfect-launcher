import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v4 as uuidv4 } from 'uuid'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function uuid() {
  return uuidv4()
}

export function searchIncludes(value, search) {
  return value.toString().toLowerCase().includes(search.toLowerCase())
}
