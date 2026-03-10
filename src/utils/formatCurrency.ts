export function formatCurrency(
  amount: number,
  currency: 'NGN' | 'USD' = 'NGN',
  roundUpToWhole = false
): string {
  const symbol = currency === 'NGN' ? '₦' : '$';
  const value = roundUpToWhole ? Math.ceil(amount) : amount;
  const fractionDigits = roundUpToWhole
    ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return `${symbol}${value.toLocaleString('en-NG', fractionDigits)}`;
}
