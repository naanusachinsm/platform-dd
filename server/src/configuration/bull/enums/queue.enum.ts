export enum QueueName {
  EMAIL = 'email-queue',
  FILE_PROCESSING = 'file-processing-queue',
  NOTIFICATION = 'notification-queue',
  CLEANUP = 'cleanup-queue',
  SUBSCRIPTION = 'subscription-queue',
  DEAD_LETTER = 'dead-letter-queue',
  CUSTOM = 'custom-queue',
  AI_PROCESSING = 'ai-processing-queue',
}

export enum JobType {
  // Email jobs
  SEND_WELCOME_EMAIL = 'send-welcome-email',
  SEND_PASSWORD_RESET = 'send-password-reset',
  SEND_PASSWORD_RESET_OTP = 'send-password-reset-otp',
  SEND_EMPLOYEE_CREDENTIALS = 'send-employee-credentials',
  SEND_STUDENT_CREDENTIALS = 'send-student-credentials',
  SEND_NOTIFICATION_EMAIL = 'send-notification-email',
  SEND_BULK_EMAIL = 'send-bulk-email',
  SEND_FINANCE_DOCUMENT = 'send-finance-document',

  // File processing jobs
  PROCESS_CSV_UPLOAD = 'process-csv-upload',
  PROCESS_EXCEL_UPLOAD = 'process-excel-upload',
  GENERATE_REPORT = 'generate-report',
  EXPORT_DATA = 'export-data',
  COMPRESS_FILE = 'compress-file',

  // Notification jobs
  SEND_PUSH_NOTIFICATION = 'send-push-notification',
  SEND_SMS = 'send-sms',
  SEND_WEBHOOK = 'send-webhook',

  // Cleanup jobs
  CLEANUP_OLD_LOGS = 'cleanup-old-logs',
  CLEANUP_TEMP_FILES = 'cleanup-temp-files',
  CLEANUP_OLD_JOBS = 'cleanup-old-jobs',
  ARCHIVE_OLD_DATA = 'archive-old-data',

  // Subscription jobs
  CREATE_DEFAULT_SUBSCRIPTION = 'create-default-subscription',

  // Custom jobs
  CUSTOM = 'custom',

  // AI processing jobs
  AI_DECOMPOSE_EPIC = 'ai-decompose-epic',
  AI_SPRINT_INSIGHTS = 'ai-sprint-insights',
  AI_RISK_ANALYSIS = 'ai-risk-analysis',
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
}
