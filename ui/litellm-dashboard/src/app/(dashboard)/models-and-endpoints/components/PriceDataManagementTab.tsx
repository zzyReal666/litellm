import PriceDataReload from "@/components/price_data_reload";
import React from "react";
import { useTranslation } from "react-i18next";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useModelCostMap } from "../../hooks/models/useModelCostMap";

const PriceDataManagementTab = () => {
  const { t } = useTranslation();
  const { accessToken } = useAuthorized();
  const { refetch: refetchModelCostMap } = useModelCostMap();

  return (
    <div>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            {t("pages.priceDataManagement.title", { defaultValue: "Price Data Management" })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("pages.priceDataManagement.description", {
              defaultValue: "Manage model pricing data and configure automatic reload schedules",
            })}
          </p>
        </div>
        <PriceDataReload
          accessToken={accessToken}
          onReloadSuccess={() => {
            refetchModelCostMap();
          }}
          buttonText={t("pages.priceDataManagement.reloadButtonText", { defaultValue: "Reload Price Data" })}
          size="middle"
          type="primary"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default PriceDataManagementTab;
