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

export interface CunexNotification {
  /** CUNEX userId (not our user id) */
  userId: string;
  textTh: string;
  textEn?: string;
  /** Opened when the user taps the notification; CUNEX appends ?token= */
  callbackUrl?: string;
}

export interface NotificationReport {
  succeeded: number;
  failed: number;
}

export abstract class CunexClient {
  /** Exchanges a CUNEX login token for the student's profile. */
  abstract getProfile(token: string): Promise<CunexProfile>;

  /** Where to send the browser for "เข้าสู่ระบบด้วยบัญชีจุฬาฯ". */
  abstract loginUrl(options: { mockUser?: string }): string;

  /** UniversalLink that opens the CUNEX app at `callbackUrl` with a token. */
  abstract createShareLink(callbackUrl: string): Promise<string>;

  /** Push notifications; per-user quota failures are counted, not thrown. */
  abstract sendNotifications(
    items: CunexNotification[],
  ): Promise<NotificationReport>;
}
