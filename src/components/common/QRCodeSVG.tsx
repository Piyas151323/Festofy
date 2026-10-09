import React, { useMemo } from 'react';
import QRCode from 'qrcode';

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
}

/**
 * Standards-compliant, ISO/IEC 18004 scannable SVG QR Code Generator for Festofy Gate Passes.
 * Backed by the official qrcode specification engine with error correction.
 */
export const QRCodeSVG: React.FC<QRCodeSVGProps> = ({
  value,
  size = 160,
  className = '',
  fgColor = '#000000',
  bgColor = '#ffffff'
}) => {
  const qrData = useMemo(() => {
    try {
      const qr = QRCode.create(value || 'FESTOFY', {
        errorCorrectionLevel: 'M'
      });
      const moduleCount = qr.modules.size;
      const margin = 2; // quiet zone
      const totalCount = moduleCount + margin * 2;
      const cellSize = 10;
      const totalDimension = totalCount * cellSize;

      const rects: Array<{ x: number; y: number }> = [];
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.modules.get(r, c)) {
            rects.push({
              x: (c + margin) * cellSize,
              y: (r + margin) * cellSize
            });
          }
        }
      }

      return {
        totalDimension,
        cellSize,
        rects
      };
    } catch (err) {
      console.warn('Notice generating QR matrix:', err);
      return null;
    }
  }, [value]);

  if (!qrData) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-zinc-100 text-zinc-500 text-xs font-mono rounded-lg ${className}`}
      >
        QR Unavailable
      </div>
    );
  }

  const { totalDimension, cellSize, rects } = qrData;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${totalDimension} ${totalDimension}`}
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
      role="img"
      aria-label={`Official Scannable QR Code for Ticket ${value}`}
    >
      <rect width={totalDimension} height={totalDimension} fill={bgColor} />
      {rects.map((pt, idx) => (
        <rect
          key={idx}
          x={pt.x}
          y={pt.y}
          width={cellSize}
          height={cellSize}
          fill={fgColor}
        />
      ))}
    </svg>
  );
};
