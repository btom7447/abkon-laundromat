export type NotificationPrefs = {
  urgent: boolean;
  uncollected: boolean;
  unpaid: boolean;
  smsFailed: boolean;
  cashReconcile: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  urgent: true,
  uncollected: true,
  unpaid: true,
  smsFailed: true,
  cashReconcile: true,
};
