interface WelcomeEmailData {
  userName: string
  email: string
  temporaryPassword: string
  role: string
  loginUrl: string
}

interface AdminNotificationData {
  newAdminName: string
  newAdminEmail: string
  createdByName: string
  createdByEmail: string
}

export function generateWelcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const roleTranslations = {
    OWNER: 'Tulajdonos',
    TENANT: 'Bérlő',
    PROVIDER: 'Szolgáltató',
    ADMIN: 'Rendszergazda'
  }

  const subject = `Üdvözöljük a Molino RENTAL CRM rendszerében!`

  const html = `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Üdvözöljük a Molino RENTAL CRM-ben</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Molino RENTAL CRM</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Ingatlankezelő rendszer</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #667eea; margin-top: 0;">Üdvözöljük, ${data.userName}!</h2>
        
        <p>Sikeresen létrehozták az Ön fiókját a Molino RENTAL CRM rendszerében <strong>${roleTranslations[data.role as keyof typeof roleTranslations]}</strong> jogosultságokkal.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin-top: 0; color: #667eea;">Belépési adatok:</h3>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.email}</p>
            <p style="margin: 5px 0;"><strong>Ideiglenes jelszó:</strong> <code style="background: #f1f3f4; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${data.temporaryPassword}</code></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Bejelentkezés a rendszerbe
            </a>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #856404;">⚠️ Fontos biztonsági tudnivalók:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Első bejelentkezés után <strong>kötelező</strong> megváltoztatni a jelszót</li>
                <li>Használjon erős jelszót (min. 8 karakter, nagybetű, kisbetű, szám)</li>
                <li>Ne ossza meg a belépési adatokat senkivel</li>
                <li>Mindig jelentkezzen ki a munkamenet végén</li>
            </ul>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d;">
            <p>Ha kérdése van, forduljon rendszergazdájához vagy írjon nekünk:</p>
            <p>📧 <a href="mailto:support@molino-rental.hu" style="color: #667eea;">support@molino-rental.hu</a></p>
            <p>📞 +36 1 234 5678</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
            <p>Ez egy automatikusan generált email. Kérjük, ne válaszoljon rá.</p>
            <p>© ${new Date().getFullYear()} Molino RENTAL CRM. Minden jog fenntartva.</p>
        </div>
    </div>
</body>
</html>`

  return { subject, html }
}

export function generateAdminNotificationEmail(data: AdminNotificationData): { subject: string; html: string } {
  const subject = `Új rendszergazda hozzáadva - ${data.newAdminName}`

  const html = `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Új rendszergazda értesítés</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🔐 Rendszergazda értesítés</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Molino RENTAL CRM</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #ff6b6b; margin-top: 0;">Új rendszergazda hozzáadva</h2>
        
        <p>Értesítjük, hogy egy új rendszergazda fiók került létrehozásra a rendszerben.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
            <h3 style="margin-top: 0; color: #ff6b6b;">Új rendszergazda adatai:</h3>
            <p style="margin: 5px 0;"><strong>Név:</strong> ${data.newAdminName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${data.newAdminEmail}</p>
            <p style="margin: 5px 0;"><strong>Létrehozta:</strong> ${data.createdByName} (${data.createdByEmail})</p>
            <p style="margin: 5px 0;"><strong>Időpont:</strong> ${new Date().toLocaleString('hu-HU')}</p>
        </div>
        
        <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #0c5460;">ℹ️ További információ:</h4>
            <p style="margin: 0;">Az új rendszergazda jogosultságokkal rendelkezik a teljes rendszer kezeléséhez, beleértve:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Felhasználók létrehozása és kezelése</li>
                <li>Rendszerbeállítások módosítása</li>
                <li>Összes adat megtekintése és szerkesztése</li>
                <li>Biztonsági funkciók kezelése</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/users" style="display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Felhasználók kezelése
            </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d;">
            <p>Ha ez a művelet nem az Ön hozzájárulásával történt, azonnal jelentkezzen be és vizsgálja felül a rendszer biztonságát.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #9ca3af;">
            <p>Ez egy automatikusan generált biztonsági értesítés.</p>
            <p>© ${new Date().getFullYear()} Molino RENTAL CRM. Minden jog fenntartva.</p>
        </div>
    </div>
</body>
</html>`

  return { subject, html }
}