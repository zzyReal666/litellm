"use client";

import { Check, Globe } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { setLocalStorageItem } from "@/utils/localStorageUtils";

const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation();

  const selectLanguage = (code: string) => {
    void i18n.changeLanguage(code);
    // Only an explicit choice is persisted, so browser detection keeps working
    // for users who never picked a language.
    setLocalStorageItem(LANGUAGE_STORAGE_KEY, code);
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("navbar.language")}
            title={t("navbar.language")}
            className="text-muted-foreground"
          />
        }
      >
        <Globe />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-auto">
        {SUPPORTED_LANGUAGES.map((language) => (
          <DropdownMenuItem key={language.code} onClick={() => selectLanguage(language.code)}>
            <span className="flex-1">{language.label}</span>
            {i18n.language === language.code && <Check className="size-3.5" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
