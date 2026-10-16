import React, { useRef } from 'react';
import { Pipette, Check } from 'lucide-react';
import { PRESET_COLORS } from '../../lib/constants';

// Helper to convert any hex color to neo-brutalist pastel tone (preserves hue, softens lightness & saturation)
export function hexToHsl(hex) {
  let r = 0, g = 0, b = 0;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length >= 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h, s, l) {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function toNeoPastel(hex) {
  if (!hex || typeof hex !== 'string') return '#D4F7E6';
  try {
    const [h, s, l] = hexToHsl(hex);
    // Keep hue, adjust to app's harmonious pastel tone (lightness 86-93%, saturation 50-80%)
    const targetS = Math.min(80, Math.max(50, s || 60));
    const targetL = Math.min(93, Math.max(86, l < 80 ? 88 : l));
    return hslToHex(h, targetS, targetL);
  } catch (e) {
    return hex;
  }
}

export default function NeoColorPicker({ selectedColor, onChange, label = 'WARNA' }) {
  const colorInputRef = useRef(null);

  const isCustom = selectedColor && !PRESET_COLORS.map(c => c.toLowerCase()).includes(selectedColor.toLowerCase());

  const handleCustomChange = (e) => {
    const rawHex = e.target.value;
    const pastelHex = toNeoPastel(rawHex);
    onChange(pastelHex);
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '12px', fontWeight: '700' }}>{label}</label>
        <span style={{ fontSize: '11px', color: '#666', fontFamily: 'monospace' }}>
          {selectedColor?.toUpperCase()}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {/* Preset Palette */}
        {PRESET_COLORS.map((c) => {
          const isSelected = selectedColor?.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              style={{
                width: '36px',
                height: '36px',
                border: isSelected ? '3px solid #1A1D1E' : '2px solid #1A1D1E',
                borderRadius: '8px',
                background: c,
                boxShadow: isSelected ? '2px 2px 0px #1A1D1E' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
              title={c}
            >
              {isSelected && <Check size={16} color="#1A1D1E" strokeWidth={3} />}
            </button>
          );
        })}

        {/* Custom Color Swatch (if active) */}
        {isCustom && (
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #1A1D1E',
              borderRadius: '8px',
              background: selectedColor,
              boxShadow: '2px 2px 0px #1A1D1E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={`Kustom: ${selectedColor}`}
          >
            <Check size={16} color="#1A1D1E" strokeWidth={3} />
          </button>
        )}

        {/* Native Pipette / Color Picker Button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            style={{
              width: '36px',
              height: '36px',
              border: '2px solid #1A1D1E',
              borderRadius: '8px',
              background: '#FFFFFF',
              boxShadow: '2px 2px 0px #1A1D1E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Pilih warna kustom (otomatis menyesuaikan tone pastel)"
          >
            <Pipette size={16} color="#1A1D1E" />
          </button>

          <input
            ref={colorInputRef}
            type="color"
            value={selectedColor || '#D4F7E6'}
            onChange={handleCustomChange}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>
      <p style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>
        *Warna kustom otomatis diharmonisasi agar tetap senada dengan tema neo-brutalisme.
      </p>
    </div>
  );
}
