export const constructEndpointUrl = (
  value: string | null | undefined
): string => {
  if (!value) return ''

  // Если уже есть протокол, используем как есть
  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('/')
  ) {
    return decodeURIComponent(value)
  }

  // Для localhost и IP адресов - определяем протокол автоматически
  if (
    value.startsWith('localhost') ||
    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(value)
  ) {
    // Для localhost и IP используем HTTP (обычно development)
    return `http://${decodeURIComponent(value)}`
  }

  // Для доменных имен используем HTTPS по умолчанию
  return `https://${decodeURIComponent(value)}`
}
