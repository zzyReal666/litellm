import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import type { ProductLicenseInfo } from "@/lib/http/productLicense";
import { getProductLicenseInfo } from "@/lib/http/productLicense";
import { createQueryKeys } from "../common/queryKeysFactory";

const productLicenseKeys = createQueryKeys("productLicense");

export const useProductLicenseInfo = (): UseQueryResult<ProductLicenseInfo> => {
  const options = {
    queryKey: productLicenseKeys.detail("info"),
    queryFn: getProductLicenseInfo,
    staleTime: 30 * 1000,
    retry: false,
  };
  return useQuery(options);
};
