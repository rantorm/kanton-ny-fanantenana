import QRCode from 'qrcode'
import type { Member } from '../types/database.types'

/** Format du contenu du QR : opaque et versionné */
export function buildQrContent(qrToken: string): string {
  return `KF:v1:${qrToken}`
}

/** Génère un DataURL PNG du QR code */
export async function generateQrDataUrl(
  qrToken: string,
  size = 300
): Promise<string> {
  const content = buildQrContent(qrToken)
  return QRCode.toDataURL(content, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}

/** Génère un SVG string du QR code */
export async function generateQrSvg(qrToken: string, size = 300): Promise<string> {
  const content = buildQrContent(qrToken)
  return QRCode.toString(content, {
    type: 'svg',
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
  })
}

/** Télécharge un QR code individuel en PNG */
export async function downloadMemberQr(member: Member) {
  const dataUrl = await generateQrDataUrl(member.qr_token, 600)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `QR-${member.member_code}-${member.last_name}.png`
  link.click()
}

/** Prépare les données pour une planche d'impression */
export interface BadgeData {
  member: Member
  qrDataUrl: string
}

export async function prepareBadges(members: Member[]): Promise<BadgeData[]> {
  const results: BadgeData[] = []
  for (const member of members) {
    const qrDataUrl = await generateQrDataUrl(member.qr_token, 280)
    results.push({ member, qrDataUrl })
  }
  return results
}