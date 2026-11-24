/**
 * 临时隐藏的产品入口。放开某个入口时，从这里删除对应值即可，
 * 详细清单与放开步骤见 Doc4zzy（文档for张忠源）/临时隐藏功能清单-20261124.md。
 */
export const HIDDEN_MENU_GROUP_LABELS: ReadonlySet<string> = new Set(["DEVELOPER TOOLS"]);

export const HIDDEN_MENU_ITEM_KEYS: ReadonlySet<string> = new Set(["organizations"]);

export const isMenuGroupHidden = (groupLabel: string): boolean => HIDDEN_MENU_GROUP_LABELS.has(groupLabel);

export const isMenuItemHidden = (itemKey: string): boolean => HIDDEN_MENU_ITEM_KEYS.has(itemKey);
