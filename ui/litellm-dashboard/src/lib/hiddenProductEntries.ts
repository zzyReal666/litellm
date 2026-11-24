/**
 * 临时隐藏的产品入口。放开某个入口时，从这里删除对应值即可，
 * 详细清单与放开步骤见 Doc4zzy（文档for张忠源）/06-研发记录与版本变更/临时隐藏功能清单-20261124.md。
 */
export const HIDDEN_MENU_GROUP_LABELS: ReadonlySet<string> = new Set(["DEVELOPER TOOLS"]);

export const HIDDEN_MENU_ITEM_KEYS: ReadonlySet<string> = new Set(["organizations"]);

export const HIDE_REGENERATE_KEY_BUTTON: boolean = true;

export const HIDE_AUDIT_LOGS_TAB: boolean = true;

export const isMenuGroupHidden = (groupLabel: string): boolean => HIDDEN_MENU_GROUP_LABELS.has(groupLabel);

export const isMenuItemHidden = (itemKey: string): boolean => HIDDEN_MENU_ITEM_KEYS.has(itemKey);
