export const ADMIN_EMAIL = "noballondesk@gmail.com";

export const isAdminEmail = (email) =>
  String(email || "").trim().toLowerCase() === ADMIN_EMAIL;
