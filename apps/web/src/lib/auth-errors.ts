const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Geçersiz e-posta adresi.",
  "auth/user-disabled": "Bu hesap devre dışı bırakılmış.",
  "auth/user-not-found": "E-posta veya şifre hatalı.",
  "auth/wrong-password": "E-posta veya şifre hatalı.",
  "auth/invalid-credential": "E-posta veya şifre hatalı.",
  "auth/email-already-in-use": "Bu e-posta adresi zaten kayıtlı.",
  "auth/weak-password": "Şifre en az 6 karakter olmalı.",
  "auth/popup-closed-by-user": "Google ile giriş penceresi kapatıldı.",
  "auth/network-request-failed": "Ağ hatası, tekrar deneyin.",
  "auth/too-many-requests": "Çok fazla deneme yapıldı, lütfen daha sonra tekrar deneyin.",
};

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | undefined)?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  return "Bir hata oluştu, lütfen tekrar deneyin.";
}
