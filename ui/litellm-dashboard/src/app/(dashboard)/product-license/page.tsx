"use client";

import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import ProductLicensePanel from "@/components/product_license/ProductLicensePanel";

export default function ProductLicensePage() {
  const { accessToken } = useAuthorized();

  if (!accessToken) {
    return null;
  }

  return (
    <div className="p-6">
      <ProductLicensePanel />
    </div>
  );
}
