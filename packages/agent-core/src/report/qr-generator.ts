import QRCode from 'qrcode';
import { AdvisoryVerificationDigest } from './advisory-hasher.js';

export interface QRCodeBundle {
  svg: string;
  dataUrl: string;
  verificationUrl: string;
}

/**
 * Generates an SVG string of a QR Code representing the verification URL.
 */
export async function generateQRCodeSVG(text: string): Promise<string> {
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#0F3D26', // Deep agricultural green
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    return svg;
  } catch (err) {
    console.error('Failed to generate SVG QR code:', err);
    // Fallback minimal SVG placeholder
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="#f0fdf4"/><text x="50" y="50" font-size="10" text-anchor="middle" fill="#166534">QR</text></svg>`;
  }
}

/**
 * Generates a PNG DataURL of a QR Code.
 */
export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 200,
      color: {
        dark: '#0F3D26',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Failed to generate DataURL QR code:', err);
    // Minimal 1x1 transparent PNG data url fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
}

/**
 * Generates both SVG and DataURL representations of an advisory verification payload.
 */
export async function generateAdvisoryQRCodes(digest: AdvisoryVerificationDigest): Promise<QRCodeBundle> {
  const [svg, dataUrl] = await Promise.all([
    generateQRCodeSVG(digest.verificationUrl),
    generateQRCodeDataURL(digest.verificationUrl)
  ]);

  return {
    svg,
    dataUrl,
    verificationUrl: digest.verificationUrl
  };
}
