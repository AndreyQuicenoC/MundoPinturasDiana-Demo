/** 573122486627 -> +57 312 248 6627 */
export const prettyPhone = (digits: string) => digits.replace(/^57(\d{3})(\d{3})(\d{4})$/, '+57 $1 $2 $3')
