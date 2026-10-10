const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
export const formatNaira = (n) => naira.format(n)

export const unitLabel = (unit) => ({ yard: 'per yard', set: 'per set', piece: 'each' }[unit] ?? '')
