import { revalidateTag } from 'next/cache'

export const bust = (...tags: string[]) => {
  for (const t of tags) {
    try {
      revalidateTag(t, 'max')
    } catch {}
  }
}
