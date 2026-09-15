"use client";

// Importing the module initialises i18next and registers the language side effects
// (document language, dayjs locale) for every route in the app.
import "@/lib/i18n";

export function I18nInit({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
