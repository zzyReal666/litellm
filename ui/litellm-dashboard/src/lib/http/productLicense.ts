/**
 * Product software license (authorization) endpoints.
 *
 * These calls must work before the dashboard has a session and before the proxy
 * is authorized, so they deliberately skip the auth header injected by the
 * openapi client and read one raw text/blob response (the request-code
 * download). Raw fetch lives here because src/lib/http is the only layer
 * allowed to call it directly.
 */
import { ApiError, deriveErrorMessage } from "./client";
import { getRequestBaseUrl } from "./runtime";

export interface ProductLicenseInfo {
  product_name: string;
  product_version: string;
  serial_number: string;
  status: string;
  time: string;
  create_time: string;
  auth_state: string;
  machine_code: string;
  user_count: number | null;
  thread_count: number | null;
  user_desc: string | null;
  license_version: number | null;
  native_available: boolean;
  license_file: string;
  message: string;
}

export interface ProductLicenseImportResponse {
  message: string;
  license: ProductLicenseInfo;
}

export interface ProductLicenseRequestFile {
  blob: Blob;
  filename: string;
}

const buildUrl = (path: string): string => {
  const base = (getRequestBaseUrl() ?? "").replace(/\/+$/, "");
  return `${base}${path}`;
};

const rejectResponse = async (response: Response): Promise<never> => {
  const raw = await response.text();
  let body: unknown = raw;
  let message = raw || `HTTP ${response.status}`;
  try {
    body = JSON.parse(raw);
    message = deriveErrorMessage(body);
  } catch {
    // keep the raw response text as the message
  }
  throw new ApiError(message, response.status, body);
};

export const getProductLicenseInfo = async (): Promise<ProductLicenseInfo> => {
  const response = await fetch(buildUrl("/product/license/info"));
  if (!response.ok) {
    return rejectResponse(response);
  }
  return response.json();
};

export const downloadProductLicenseRequest = async (): Promise<ProductLicenseRequestFile> => {
  const response = await fetch(buildUrl("/product/license/request"));
  if (!response.ok) {
    return rejectResponse(response);
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const filenameMatch = /filename="?([^";]+)"?/.exec(disposition);
  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] ?? "product_license_request.txt",
  };
};

export const importProductLicense = async (file: File): Promise<ProductLicenseImportResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(buildUrl("/product/license/import"), {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    return rejectResponse(response);
  }
  return response.json();
};
