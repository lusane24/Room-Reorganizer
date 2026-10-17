const NUM = '(\\d+(?:\\.\\d+)?)';
const INCHES_ONLY = new RegExp(`^${NUM}\\s*(?:"|in|inches)$`, 'i');
const FEET_AND_INCHES = new RegExp(
  `^${NUM}\\s*(?:'|ft|feet)?(?:\\s*${NUM}\\s*(?:"|in|inches)?)?$`,
  'i',
);

/** Parse text like `12' 6"`, `12.5` (feet) or `150"` into inches; null if invalid or not positive. */
export function parseLength(text) {
  if (typeof text !== 'string') return null;
  const s = text.trim();
  let inches = null;

  const onlyInches = INCHES_ONLY.exec(s);
  if (onlyInches) {
    inches = Number(onlyInches[1]);
  } else {
    const m = FEET_AND_INCHES.exec(s);
    if (m) inches = Number(m[1]) * 12 + (m[2] ? Number(m[2]) : 0);
  }

  return Number.isFinite(inches) && inches > 0 ? inches : null;
}

/** Format inches as `12' 6"`, rounded to the nearest half inch. */
export function formatLength(inches) {
  const rounded = Math.round(inches * 2) / 2;
  const feet = Math.floor(rounded / 12);
  const rest = rounded - feet * 12;
  if (feet === 0) return `${rest}"`;
  if (rest === 0) return `${feet}'`;
  return `${feet}' ${rest}"`;
}
