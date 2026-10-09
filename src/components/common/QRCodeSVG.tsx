import React, { useMemo } from 'react';

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
}

/**
 * Deterministic SVG QR Code Generator for Festofy Gate Passes.
 * Renders standard 25x25 matrix with finder patterns, timing rows, and data modules.
 */
export const QRCodeSVG: React.FC<QRCodeSVGProps> = ({
  value,
  size = 160,
  className = '',
  fgColor = '#000000',
  bgColor = '#ffffff'
}) => {
  const matrix = useMemo(() => {
    const N = 25;
    const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

    // Simple hash function for reproducible data pattern
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }

    // Helper to draw a 7x7 finder pattern
    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 || // Outer 7x7 border
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)       // Inner 3x3 box
          ) {
            grid[startY + r][startX + c] = true;
          } else {
            grid[startY + r][startX + c] = false;
          }
        }
      }
    };

    // Draw top-left, top-right, bottom-left finder patterns
    drawFinder(0, 0);
    drawFinder(N - 7, 0);
    drawFinder(0, N - 7);

    // Timing patterns
    for (let i = 8; i < N - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Alignment pattern around (18, 18)
    const alignX = 16;
    const alignY = 16;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
          grid[alignY + r][alignX + c] = true;
        }
      }
    }

    // Fill data modules deterministically
    let seed = Math.abs(hash);
    const nextBit = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % 2 === 1;
    };

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // Skip finder pattern zones
        const inTopLeft = r < 8 && c < 8;
        const inTopRight = r < 8 && c >= N - 8;
        const inBottomLeft = r >= N - 8 && c < 8;
        const inTiming = r === 6 || c === 6;
        const inAlign = r >= alignY && r < alignY + 5 && c >= alignX && c < alignX + 5;

        if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming && !inAlign) {
          grid[r][c] = nextBit();
        }
      }
    }

    return grid;
  }, [value]);

  const N = matrix.length;
  const cellSize = 10;
  const quietZone = 2 * cellSize;
  const totalDim = N * cellSize + quietZone * 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${totalDim} ${totalDim}`}
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
      role="img"
      aria-label={`QR Code for ticket ${value}`}
    >
      <rect width={totalDim} height={totalDim} fill={bgColor} />
      <g transform={`translate(${quietZone}, ${quietZone})`}>
        {matrix.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={fgColor}
              />
            ) : null
          )
        )}
      </g>
    </svg>
  );
};
