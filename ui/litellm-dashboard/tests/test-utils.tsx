import React, { PropsWithChildren } from "react";
import { render, RenderOptions, screen, waitFor } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsTestingAdapter, OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { expect } from "vitest";

import { getI18n, I18nProvider, type Locale } from "@/i18n";
import { LOCALE_STORAGE_KEY } from "@/i18n/localePreferences";

// Create a client for testing
export const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: Infinity,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
    mutations: {
      retry: false,
    },
  },
});

interface ProviderOptions {
  searchParams?: string | Record<string, string> | URLSearchParams;
  onUrlUpdate?: OnUrlUpdateFunction;
}

export const renderWithProviders = (ui: React.ReactElement, options?: RenderOptions & ProviderOptions) => {
  const { searchParams, onUrlUpdate, ...renderOptions } = options ?? {};
  const Providers: React.FC<PropsWithChildren> = ({ children }) => (
    <NuqsTestingAdapter searchParams={searchParams} onUrlUpdate={onUrlUpdate} hasMemory>
      <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
    </NuqsTestingAdapter>
  );
  return render(ui, { wrapper: Providers, ...renderOptions });
};

interface I18nRenderOptions extends ProviderOptions {
  locale?: Locale;
}

/**
 * Render inside the real `I18nProvider`, which keeps its subtree unmounted until
 * the i18next instance is ready and only then syncs `<html lang>`. Clearing that
 * attribute first makes the sync a strict "subtree is rendered" signal, so callers
 * can query synchronously after awaiting this helper.
 */
export const renderWithI18n = async (ui: React.ReactElement, options?: RenderOptions & I18nRenderOptions) => {
  const { locale = "en", ...renderOptions } = options ?? {};
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  const instance = await getI18n();
  await instance.changeLanguage(locale);

  document.documentElement.lang = "";
  const result = renderWithProviders(<I18nProvider>{ui}</I18nProvider>, renderOptions);
  await waitFor(() => expect(document.documentElement.lang).toBe(locale));
  return result;
};

const pointerBlocked = (element: HTMLElement): boolean => {
  for (let node: HTMLElement | null = element; node !== null; node = node.parentElement) {
    if (node.style.pointerEvents === "none") return true;
  }
  return false;
};

export const chooseSelectOption = async (
  user: Pick<ReturnType<typeof userEvent.setup>, "click">,
  trigger: HTMLElement,
  optionName: string | RegExp,
  role: "option" | "menuitem" | "menuitemradio" = "option",
) => {
  await user.click(trigger);
  const option = await screen.findByRole(role, { name: optionName });
  await waitFor(() => expect(pointerBlocked(option)).toBe(false));
  await user.click(option);
};

export * from "@testing-library/react";
