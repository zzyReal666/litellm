"use client";

import { useMemo, useState } from "react";

import i18n from "@/lib/i18n";
import { useInfiniteSpendLogEndUsers } from "@/app/(dashboard)/hooks/spendLogs/useSpendLogEndUsers";
import { useInfiniteSpendLogUsers } from "@/app/(dashboard)/hooks/spendLogs/useSpendLogUsers";
import { useInfiniteKeyAliases } from "@/app/(dashboard)/hooks/keys/useKeyAliases";
import { useInfiniteModelInfo } from "@/app/(dashboard)/hooks/models/useModels";
import { DataTableFilterField } from "@/components/shared/DataTable";
import { PaginatedSearchSelect } from "@/components/shared/PaginatedSearchSelect";
import { SearchSelect, type SearchSelectOption } from "@/components/shared/SearchSelect";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Team } from "../../key_team_helpers/key_list";
import { CREDENTIAL_LABELS, ERROR_CODE_OPTIONS } from "../constants";
import { LOG_FILTER_IDS, type LogsWindow } from "./useLogFilterLogic";

const ALL_VALUE = "all";

const STATUS_FILTER_ITEMS = [
  { value: ALL_VALUE, label: i18n.t("viewLogs.filters.allStatuses", { defaultValue: "All Statuses" }) },
  { value: "success", label: i18n.t("common.success", { defaultValue: "Success" }) },
  { value: "failure", label: i18n.t("viewLogs.filters.failure", { defaultValue: "Failure" }) },
] as const;

const CACHE_FILTER_ITEMS = [
  { value: ALL_VALUE, label: i18n.t("viewLogs.filters.allRequests", { defaultValue: "All Requests" }) },
  { value: "hit", label: i18n.t("viewLogs.filters.cacheHit", { defaultValue: "Cache Hit" }) },
  { value: "miss", label: i18n.t("viewLogs.filters.cacheMiss", { defaultValue: "Cache Miss" }) },
] as const;

const CREDENTIAL_FILTER_ITEMS = [
  { value: ALL_VALUE, label: i18n.t("viewLogs.filters.allCredentials", { defaultValue: "All Credentials" }) },
  ...Object.entries(CREDENTIAL_LABELS).map(([value, label]) => ({ value, label })),
] as const;

const SPAN_TYPE_FILTER_ITEMS = [
  { value: ALL_VALUE, label: i18n.t("viewLogs.filters.allTypes", { defaultValue: "All Types" }) },
  { value: "llm", label: "LLM" },
  { value: "agent", label: i18n.t("viewLogs.filters.agent", { defaultValue: "Agent" }) },
  { value: "mcp", label: "MCP" },
  { value: "batch", label: i18n.t("viewLogs.filters.batch", { defaultValue: "Batch" }) },
] as const;
const PAGE_SIZE = 50;

const SEARCH_INPUT_REASONS: ReadonlySet<string> = new Set(["input-change", "input-clear", "clear-press"]);

const asString = (value: unknown): string => (typeof value === "string" ? value : "");
const emptyToUndefined = (value: string): string | undefined => (value === "" ? undefined : value);

function TeamFilterField({
  value,
  onChange,
  teams,
}: {
  value: string;
  onChange: (value: string | undefined) => void;
  teams: Team[];
}) {
  const options = useMemo<SearchSelectOption[]>(
    () =>
      teams.map((team) => ({
        label: team.team_alias || team.team_id,
        value: team.team_id,
        sublabel: team.team_id,
      })),
    [teams],
  );

  return (
    <DataTableFilterField label={i18n.t("viewLogs.filters.teamId", { defaultValue: "Team ID" })}>
      <SearchSelect
        options={options}
        value={value}
        onValueChange={(next) => onChange(next ?? undefined)}
        placeholder={i18n.t("viewLogs.filters.searchTeam", { defaultValue: "Search or select a team" })}
        emptyText={i18n.t("viewLogs.filters.noTeams", { defaultValue: "No teams found" })}
      />
    </DataTableFilterField>
  );
}

function KeyAliasFilterField({
  value,
  onChange,
  teamId,
}: {
  value: string;
  onChange: (value: string | undefined) => void;
  teamId: string;
}) {
  const [search, setSearch] = useState("");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteKeyAliases(
    PAGE_SIZE,
    emptyToUndefined(search),
    emptyToUndefined(teamId),
  );

  const options = useMemo<SearchSelectOption[]>(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.aliases.flatMap((alias) => {
        if (!alias || seen.has(alias)) return [];
        seen.add(alias);
        return [{ label: alias, value: alias }];
      }),
    );
  }, [data]);

  return (
    <DataTableFilterField label={i18n.t("viewLogs.filters.keyAlias", { defaultValue: "Key Alias" })}>
      <PaginatedSearchSelect
        options={options}
        value={value}
        onValueChange={(next) => onChange(next ?? undefined)}
        onSearchChange={setSearch}
        onLoadMore={() => void fetchNextPage()}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        placeholder={i18n.t("viewLogs.filters.searchKeyAlias", { defaultValue: "Search a key alias" })}
        emptyText={i18n.t("viewLogs.filters.noKeyAliases", { defaultValue: "No key aliases found" })}
      />
    </DataTableFilterField>
  );
}

function ModelFilterField({ value, onChange }: { value: string; onChange: (value: string | undefined) => void }) {
  const [search, setSearch] = useState("");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteModelInfo(
    PAGE_SIZE,
    emptyToUndefined(search),
  );

  const options = useMemo<SearchSelectOption[]>(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.data.flatMap((model) => {
        const modelId = model.model_info?.id ?? "";
        const modelName = model.model_name ?? "";
        if (!modelId || seen.has(modelId)) return [];
        seen.add(modelId);
        return [{ label: modelName || modelId, value: modelId, sublabel: i18n.t("viewLogs.filters.modelIdSublabel", { modelId, defaultValue: `Model ID: ${modelId}` }) }];
      }),
    );
  }, [data]);

  return (
    <DataTableFilterField label={i18n.t("viewLogs.filters.model", { defaultValue: "Model" })}>
      <PaginatedSearchSelect
        options={options}
        value={value}
        onValueChange={(next) => onChange(next ?? undefined)}
        onSearchChange={setSearch}
        onLoadMore={() => void fetchNextPage()}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        placeholder={i18n.t("viewLogs.filters.searchModel", { defaultValue: "Search a model" })}
        emptyText={i18n.t("viewLogs.filters.noModels", { defaultValue: "No models found" })}
      />
    </DataTableFilterField>
  );
}

function UserIdFilterField({
  value,
  onChange,
  logsWindow,
}: {
  value: string;
  onChange: (value: string | undefined) => void;
  logsWindow: LogsWindow;
}) {
  const [search, setSearch] = useState("");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteSpendLogUsers(
    logsWindow,
    PAGE_SIZE,
    emptyToUndefined(search),
  );

  const options = useMemo<SearchSelectOption[]>(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.data.flatMap((userId) => {
        if (!userId || seen.has(userId)) return [];
        seen.add(userId);
        return [{ label: userId, value: userId }];
      }),
    );
  }, [data]);

  return (
    <DataTableFilterField label={i18n.t("viewLogs.filters.userId", { defaultValue: "User ID" })}>
      <PaginatedSearchSelect
        options={options}
        value={value}
        onValueChange={(next) => onChange(next ?? undefined)}
        onSearchChange={setSearch}
        onLoadMore={() => void fetchNextPage()}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        placeholder={i18n.t("viewLogs.filters.searchUser", { defaultValue: "Search an internal user" })}
        emptyText={i18n.t("viewLogs.filters.noUsers", { defaultValue: "No users found" })}
      />
    </DataTableFilterField>
  );
}

function EndUserFilterField({
  value,
  onChange,
  logsWindow,
}: {
  value: string;
  onChange: (value: string | undefined) => void;
  logsWindow: LogsWindow;
}) {
  const [search, setSearch] = useState("");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteSpendLogEndUsers(
    logsWindow,
    PAGE_SIZE,
    emptyToUndefined(search),
  );

  const options = useMemo<SearchSelectOption[]>(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap((page) =>
      page.data.flatMap((endUser) => {
        if (!endUser || seen.has(endUser)) return [];
        seen.add(endUser);
        return [{ label: endUser, value: endUser }];
      }),
    );
  }, [data]);

  return (
    <DataTableFilterField label={i18n.t("viewLogs.filters.endUser", { defaultValue: "End User" })}>
      <PaginatedSearchSelect
        options={options}
        value={value}
        onValueChange={(next) => onChange(next ?? undefined)}
        onSearchChange={setSearch}
        onLoadMore={() => void fetchNextPage()}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        placeholder={i18n.t("viewLogs.filters.searchEndUser", { defaultValue: "Search an end user" })}
        emptyText={i18n.t("viewLogs.filters.noEndUsers", { defaultValue: "No end users in this time range" })}
      />
    </DataTableFilterField>
  );
}

function ErrorCodeFilterField({ value, onChange }: { value: string; onChange: (value: string | undefined) => void }) {
  const [query, setQuery] = useState("");

  const options = useMemo<SearchSelectOption[]>(() => {
    const trimmed = query.trim();
    const lowered = trimmed.toLowerCase();
    const matches = ERROR_CODE_OPTIONS.filter((option) => option.label.toLowerCase().includes(lowered));
    const isKnownCode = ERROR_CODE_OPTIONS.some(
      (option) => option.value === trimmed || option.label.toLowerCase() === lowered,
    );
    if (trimmed === "" || isKnownCode) return matches;
    return [...matches, { label: i18n.t("viewLogs.filters.useCustomCode", { code: trimmed, defaultValue: `Use custom code: ${trimmed}` }), value: trimmed }];
  }, [query]);

  const selected = useMemo<SearchSelectOption | null>(() => {
    if (value === "") return null;
    return ERROR_CODE_OPTIONS.find((option) => option.value === value) ?? { label: value, value };
  }, [value]);

  const items = useMemo<SearchSelectOption[]>(() => {
    if (selected === null) return options;
    if (options.some((option) => option.value === selected.value)) return options;
    return [selected, ...options];
  }, [options, selected]);

  return (
    <DataTableFilterField label={i18n.t("viewLogs.filters.errorCode", { defaultValue: "Error Code" })}>
      <Combobox
        items={items}
        value={selected}
        onValueChange={(item: SearchSelectOption | null) => onChange(emptyToUndefined(item?.value ?? ""))}
        onInputValueChange={(next, eventDetails) => setQuery(SEARCH_INPUT_REASONS.has(eventDetails.reason) ? next : "")}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setQuery("");
        }}
        isItemEqualToValue={(a: SearchSelectOption, b: SearchSelectOption) => a.value === b.value}
        itemToStringLabel={(item: SearchSelectOption) => item.label}
        filter={null}
      >
        <ComboboxInput
          onFocus={(event) => event.currentTarget.select()}
          placeholder={i18n.t("viewLogs.filters.searchErrorCode", { defaultValue: "Select or type an error code" })}
          showClear={value !== ""}
          className="w-full"
        />
        <ComboboxContent>
          <ComboboxEmpty>{i18n.t("viewLogs.filters.noErrorCodes", { defaultValue: "No error codes found" })}</ComboboxEmpty>
          <ComboboxList data-testid="error-code-filter-list">
            {(item: SearchSelectOption) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </DataTableFilterField>
  );
}

interface RequestLogsFiltersProps {
  get: (columnId: string) => unknown;
  set: (columnId: string, value: unknown) => void;
  teams: Team[];
  logsWindow: LogsWindow;
}

export function RequestLogsFilters({ get, set, teams, logsWindow }: RequestLogsFiltersProps) {
  const valueOf = (id: string): string => asString(get(id));
  const setter = (id: string) => (next: string | undefined) => set(id, next);

  return (
    <>
      <TeamFilterField
        value={valueOf(LOG_FILTER_IDS.TEAM_ID)}
        onChange={setter(LOG_FILTER_IDS.TEAM_ID)}
        teams={teams}
      />

      <DataTableFilterField label={i18n.t("viewLogs.filters.spanType", { defaultValue: "Span Type" })}>
        <Select
          items={SPAN_TYPE_FILTER_ITEMS}
          value={valueOf(LOG_FILTER_IDS.SPAN_TYPE) === "" ? ALL_VALUE : valueOf(LOG_FILTER_IDS.SPAN_TYPE)}
          onValueChange={(next) =>
            set(LOG_FILTER_IDS.SPAN_TYPE, next === null || next === ALL_VALUE ? undefined : next)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={i18n.t("viewLogs.filters.allTypes", { defaultValue: "All Types" })} />
          </SelectTrigger>
          <SelectContent>
            {SPAN_TYPE_FILTER_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableFilterField>

      <DataTableFilterField label={i18n.t("common.status", { defaultValue: "Status" })}>
        <Select
          items={STATUS_FILTER_ITEMS}
          value={valueOf(LOG_FILTER_IDS.STATUS) === "" ? ALL_VALUE : valueOf(LOG_FILTER_IDS.STATUS)}
          onValueChange={(next) => set(LOG_FILTER_IDS.STATUS, next === null || next === ALL_VALUE ? undefined : next)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={i18n.t("viewLogs.filters.allStatuses", { defaultValue: "All Statuses" })} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableFilterField>

      <DataTableFilterField label={i18n.t("viewLogs.filters.cache", { defaultValue: "Cache" })}>
        <Select
          items={CACHE_FILTER_ITEMS}
          value={valueOf(LOG_FILTER_IDS.CACHE_STATUS) === "" ? ALL_VALUE : valueOf(LOG_FILTER_IDS.CACHE_STATUS)}
          onValueChange={(next) =>
            set(LOG_FILTER_IDS.CACHE_STATUS, next === null || next === ALL_VALUE ? undefined : next)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={i18n.t("viewLogs.filters.allRequests", { defaultValue: "All Requests" })} />
          </SelectTrigger>
          <SelectContent>
            {CACHE_FILTER_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableFilterField>

      <DataTableFilterField label={i18n.t("viewLogs.filters.credential", { defaultValue: "Credential" })}>
        <Select
          items={CREDENTIAL_FILTER_ITEMS}
          value={valueOf(LOG_FILTER_IDS.CREDENTIAL) === "" ? ALL_VALUE : valueOf(LOG_FILTER_IDS.CREDENTIAL)}
          onValueChange={(next) =>
            set(LOG_FILTER_IDS.CREDENTIAL, next === null || next === ALL_VALUE ? undefined : next)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={i18n.t("viewLogs.filters.allCredentials", { defaultValue: "All Credentials" })} />
          </SelectTrigger>
          <SelectContent>
            {CREDENTIAL_FILTER_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DataTableFilterField>

      <KeyAliasFilterField
        value={valueOf(LOG_FILTER_IDS.KEY_ALIAS)}
        onChange={setter(LOG_FILTER_IDS.KEY_ALIAS)}
        teamId={valueOf(LOG_FILTER_IDS.TEAM_ID)}
      />

      <UserIdFilterField
        value={valueOf(LOG_FILTER_IDS.USER_ID)}
        onChange={setter(LOG_FILTER_IDS.USER_ID)}
        logsWindow={logsWindow}
      />

      <EndUserFilterField
        value={valueOf(LOG_FILTER_IDS.END_USER)}
        onChange={setter(LOG_FILTER_IDS.END_USER)}
        logsWindow={logsWindow}
      />

      <ErrorCodeFilterField value={valueOf(LOG_FILTER_IDS.ERROR_CODE)} onChange={setter(LOG_FILTER_IDS.ERROR_CODE)} />

      <DataTableFilterField label={i18n.t("viewLogs.filters.errorMessage", { defaultValue: "Error Message" })}>
        <Input
          value={valueOf(LOG_FILTER_IDS.ERROR_MESSAGE)}
          onChange={(event) => set(LOG_FILTER_IDS.ERROR_MESSAGE, emptyToUndefined(event.target.value))}
          placeholder={i18n.t("viewLogs.filters.enterErrorMessage", { defaultValue: "Enter error message…" })}
        />
      </DataTableFilterField>

      <DataTableFilterField label={i18n.t("viewLogs.filters.keyHash", { defaultValue: "Key Hash" })}>
        <Input
          value={valueOf(LOG_FILTER_IDS.KEY_HASH)}
          onChange={(event) => set(LOG_FILTER_IDS.KEY_HASH, emptyToUndefined(event.target.value))}
          placeholder={i18n.t("viewLogs.filters.enterKeyHash", { defaultValue: "Enter key hash…" })}
        />
      </DataTableFilterField>

      <DataTableFilterField label={i18n.t("viewLogs.filters.sessionId", { defaultValue: "Session ID" })}>
        <Input
          value={valueOf(LOG_FILTER_IDS.SESSION_ID)}
          onChange={(event) => set(LOG_FILTER_IDS.SESSION_ID, emptyToUndefined(event.target.value))}
          placeholder={i18n.t("viewLogs.filters.enterSessionId", { defaultValue: "Enter session ID…" })}
        />
      </DataTableFilterField>

      <ModelFilterField value={valueOf(LOG_FILTER_IDS.MODEL_ID)} onChange={setter(LOG_FILTER_IDS.MODEL_ID)} />

      <DataTableFilterField label={i18n.t("viewLogs.filters.publicModelSearch", { defaultValue: "Public model / search tool" })}>
        <Input
          value={valueOf(LOG_FILTER_IDS.PUBLIC_MODEL_OR_SEARCH_TOOL)}
          onChange={(event) => set(LOG_FILTER_IDS.PUBLIC_MODEL_OR_SEARCH_TOOL, emptyToUndefined(event.target.value))}
          placeholder={i18n.t("viewLogs.filters.enterPublicModelSearch", { defaultValue: "Enter public model or search tool…" })}
        />
      </DataTableFilterField>
    </>
  );
}
