type GoogleErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    errors?: { reason?: string; message?: string }[];
  };
};

export function mapGoogleApiError(
  status: number,
  bodyText: string
): { message: string; code?: string } {
  let body: GoogleErrorBody = {};
  try {
    body = JSON.parse(bodyText) as GoogleErrorBody;
  } catch {
    // use defaults below
  }

  const message = body.error?.message ?? bodyText;
  const reasons = body.error?.errors?.map((e) => e.reason).filter(Boolean) ?? [];
  const lower = message.toLowerCase();

  if (
    lower.includes("has not been used") ||
    lower.includes("access not configured") ||
    lower.includes("is disabled")
  ) {
    return {
      message:
        "Enable Google Sheets API and Google Drive API in Google Cloud Console → APIs & Services → Library",
      code: "API_NOT_ENABLED",
    };
  }

  if (status === 429 || lower.includes("rate limit") || lower.includes("quota")) {
    return {
      message: "Google Sheets rate limit hit — try again in a moment",
      code: "QUOTA_EXCEEDED",
    };
  }

  if (
    status === 403 &&
    (lower.includes("insufficient") ||
      lower.includes("scope") ||
      reasons.includes("insufficientPermissions"))
  ) {
    return {
      message: "Additional Google permissions needed to access Sheets",
      code: "MISSING_SCOPES",
    };
  }

  if (status === 403 || lower.includes("permission") || lower.includes("access")) {
    return {
      message:
        "You don't have access to this spreadsheet — check sharing settings in Google Drive",
      code: "PERMISSION_DENIED",
    };
  }

  if (status === 401) {
    return { message: "Not authenticated — reconnect your Google account", code: "UNAUTHORIZED" };
  }

  return { message: message || "Google API request failed", code: body.error?.status };
}
