export type Currency = "USD" | "EUR" | "GBP" | "JPY" | "MYR"

export const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  MYR: "RM",
}

export const currencyRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  MYR: 4.47, // Malaysian Ringgit conversion rate
}

export const convertPrice = (priceUSD: number, currency: Currency): number => {
  return priceUSD * currencyRates[currency]
}

export const formatPrice = (priceUSD: number, currency: Currency): string => {
  const convertedPrice = convertPrice(priceUSD, currency)
  const symbol = currencySymbols[currency]

  if (currency === "JPY") {
    return `${symbol}${Math.round(convertedPrice).toLocaleString()}`
  }

  return `${symbol}${convertedPrice.toFixed(2)}`
}
