export function isMobileUserAgent(userAgent: string): boolean {
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i
  return mobileRegex.test(userAgent)
}

export function isSafari(userAgent: string): boolean {
  return /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
}

export function getMobileUserAgentInfo(userAgent: string) {
  return {
    isMobile: isMobileUserAgent(userAgent),
    isSafari: isSafari(userAgent),
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
  }
}