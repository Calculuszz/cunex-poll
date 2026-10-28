import { z } from 'zod';

// Schema errors reach users as-is (problems[].message), so they are in Thai.
// The stock Thai locale names JS types and enum literals ("ควรเป็น string",
// "หนึ่งใน "list"|"grid""), which reads like code; every issue gets plain
// wording here and the locale is only a last resort.
export function applyThaiZodErrors() {
  z.config({
    ...z.locales.th(),
    customError: (iss) => {
      const list = iss.origin === 'array';
      const chars = iss.origin === 'string';
      const num = iss.origin === 'number' || iss.origin === 'int';
      switch (iss.code) {
        case 'too_small':
          if (chars && Number(iss.minimum) === 1) return 'ต้องกรอกช่องนี้';
          if (chars || list) {
            return `ต้องมีอย่างน้อย ${iss.minimum} ${chars ? 'ตัวอักษร' : 'รายการ'}`;
          }
          if (num) return `ต้องไม่น้อยกว่า ${iss.minimum}`;
          return 'ค่าน้อยเกินไป';
        case 'too_big':
          if (chars) return `ยาวเกิน ${iss.maximum} ตัวอักษร`;
          if (list) return `ได้ไม่เกิน ${iss.maximum} รายการ`;
          if (num) return `ต้องไม่เกิน ${iss.maximum}`;
          return 'ค่ามากเกินไป';
        case 'invalid_format':
          if (iss.format === 'url') return 'ลิงก์ไม่ถูกต้อง';
          if (iss.format === 'datetime' || iss.format === 'date') {
            return 'วันเวลาไม่ถูกต้อง';
          }
          return 'รูปแบบไม่ถูกต้อง';
        case 'invalid_type':
          if (iss.input === undefined || iss.input === null) {
            return 'ต้องกรอกช่องนี้';
          }
          if (iss.expected === 'number' || iss.expected === 'int') {
            return 'ต้องเป็นตัวเลขจำนวนเต็ม';
          }
          if (iss.expected === 'boolean') return 'ต้องเลือกเปิดหรือปิด';
          return 'ข้อมูลไม่ถูกต้อง';
        case 'invalid_value':
        case 'invalid_union':
          return 'ตัวเลือกไม่ถูกต้อง';
        case 'not_multiple_of':
          return 'ต้องเป็นจำนวนเต็ม';
        case 'unrecognized_keys':
          return 'มีข้อมูลที่ระบบไม่รู้จัก';
        default:
          return undefined;
      }
    },
  });
}
