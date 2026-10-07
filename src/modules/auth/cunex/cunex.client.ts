// Port for the CUNEX LLE API. `LiveCunexClient` calls the real gateway,
// `MockCunexClient` serves fixture students until we get credentials.

export interface CunexProfile {
  userId: string;
  studentId: string;
  facultyCode: string;
  facultyNameTh: string;
  facultyNameEn: string;
  studentYear: number;
}

export abstract class CunexClient {
  /** Exchanges a CUNEX login token for the student's profile. */
  abstract getProfile(token: string): Promise<CunexProfile>;

  /** Where to send the browser for "เข้าสู่ระบบด้วยบัญชีจุฬาฯ". */
  abstract loginUrl(options: { mockUser?: string }): string;
}
