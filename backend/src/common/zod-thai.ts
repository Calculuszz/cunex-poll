import { z } from 'zod';

// Schema errors reach users as-is (problems[].message), so they are in Thai.
// The stock Thai locale names JS types ("string ควรมี..."); the common cases
// get plain wording here and everything else falls back to the locale.
export function applyThaiZodErrors() {
  z.config({
    ...z.locales.th(),
    customError: (iss) => {
      const list = iss.origin === 'array';
      const chars = iss.origin === 'string';
      if (iss.code === 'too_small' && (chars || list)) {
        if (chars && Number(iss.minimum) === 1) return 'ต้องกรอกช่องนี้';
        return `ต้องมีอย่างน้อย ${iss.minimum} ${chars ? 'ตัวอักษร' : 'รายการ'}`;
      }
      if (iss.code === 'too_big' && (chars || list)) {
        return chars
          ? `ยาวเกิน ${iss.maximum} ตัวอักษร`
          : `ได้ไม่เกิน ${iss.maximum} รายการ`;
      }
      if (iss.code === 'invalid_format' && iss.format === 'url') {
        return 'ลิงก์ไม่ถูกต้อง';
      }
      return undefined;
    },
  });
}
