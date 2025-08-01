// Утилита для инвалидации кэша middleware
// Поскольку middleware работает на сервере, а клиент на браузере,
// мы используем специальный API endpoint для очистки серверного кэша

export const invalidateMiddlewareCache = async (
  userId: string
): Promise<void> => {
  try {
    console.log('Invalidating middleware cache for user:', userId)

    // Отправляем запрос на специальный endpoint для очистки кэша
    const response = await fetch('/api/internal/cache/invalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'company',
        userId: userId
      })
    })

    if (!response.ok) {
      console.warn(
        'Failed to invalidate middleware cache:',
        response.statusText
      )
    } else {
      console.log('Middleware cache invalidated successfully')
    }
  } catch (error) {
    console.warn('Error invalidating middleware cache:', error)
    // Не прерываем выполнение, так как это не критично
  }
}

// Функция для принудительного обновления страницы
// Используется когда нужно гарантированно обновить middleware
export const forcePageReload = (delay = 1000): void => {
  console.log('Forcing page reload to refresh middleware cache')
  setTimeout(() => {
    window.location.reload()
  }, delay)
}
