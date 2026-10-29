"use client";

import React, { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductLicenseInfo } from "@/app/(dashboard)/hooks/productLicense/useProductLicenseInfo";
import { ProductLicenseInfo, downloadProductLicenseRequest, importProductLicense } from "@/lib/http/productLicense";
import { buildLicenseRows } from "@/components/product_license/productLicenseRows";
import { toast } from "@/lib/toast";

interface ProductLicensePanelProps {
  standalone?: boolean;
}

interface LicenseDetailsCardProps {
  info: ProductLicenseInfo | null;
  loading: boolean;
}

const LicenseDetailsCard = ({ info, loading }: LicenseDetailsCardProps) => {
  if (loading) {
    return <p className="text-sm text-muted-foreground">加载中...</p>;
  }
  if (!info) {
    return <p className="text-sm text-muted-foreground">暂无授权信息</p>;
  }
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {buildLicenseRows(info).map((row) => (
        <div key={row.label}>
          <dt className="text-xs text-muted-foreground">{row.label}</dt>
          <dd className="mt-1 break-all text-sm font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
};

const LicenseStatusAlerts = ({ info, error }: { info: ProductLicenseInfo | null; error: string | null }) => {
  if (error) {
    return (
      <Alert variant="error">
        <AlertTitle>无法获取授权信息</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (!info) {
    return null;
  }
  if (info.auth_state !== "authorized") {
    return (
      <Alert variant="warning">
        <AlertTitle>本产品尚未授权</AlertTitle>
        <AlertDescription>{info.message}</AlertDescription>
      </Alert>
    );
  }
  if (!info.native_available) {
    return (
      <Alert variant="warning">
        <AlertTitle>授权组件不可用</AlertTitle>
        <AlertDescription>
          请确认服务器已安装 liblicense.so，并通过 LITELLM_PRODUCT_LICENSE_LIB 指定其路径
        </AlertDescription>
      </Alert>
    );
  }
  return null;
};

export default function ProductLicensePanel({ standalone = false }: ProductLicensePanelProps) {
  const licenseQuery = useProductLicenseInfo();
  const [busy, setBusy] = useState<boolean>(false);
  const [importedInfo, setImportedInfo] = useState<ProductLicenseInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: importProductLicense,
    onSuccess: (response) => {
      setImportedInfo(response.license);
      toast.success(response.message);
    },
    onError: (importError) => {
      toast.fromError(importError);
    },
  });

  const info = importedInfo ?? licenseQuery.data ?? null;
  const queryError = licenseQuery.error instanceof Error ? licenseQuery.error.message : null;
  const authorized = info?.auth_state === "authorized";

  const handleDownloadRequest = async () => {
    setBusy(true);
    try {
      const { blob, filename } = await downloadProductLicenseRequest();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("授权申请码已下载");
    } catch (downloadError) {
      toast.fromError(downloadError);
    } finally {
      setBusy(false);
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    importMutation.mutate(file);
  };

  const pending = busy || importMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{standalone ? "软件授权激活" : "授权信息"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {info ? `${info.product_name} · 版本 ${info.product_version}` : "产品必须先完成授权才能使用"}
          </p>
        </div>
        {info ? (
          <Badge variant={authorized ? "default" : "destructive"} data-testid="product-license-status">
            {info.status}
          </Badge>
        ) : null}
      </div>

      <LicenseStatusAlerts info={info} error={queryError} />

      <Card>
        <CardHeader>
          <CardTitle>授权信息</CardTitle>
        </CardHeader>
        <CardContent>
          <LicenseDetailsCard info={info} loading={licenseQuery.isLoading} />
        </CardContent>
      </Card>

      {info && !authorized ? (
        <Card>
          <CardHeader>
            <CardTitle>授权激活步骤</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>点击“下载授权申请码”，把生成的申请码文件提交给厂商。</li>
              <li>拿到厂商签发的授权文件后，点击“上传授权文件”完成导入。</li>
              <li>导入成功后会自动刷新授权状态，即可正常使用本产品。</li>
            </ol>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={handleDownloadRequest} disabled={pending}>
          下载授权申请码
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} disabled={pending}>
          {pending ? "处理中..." : "上传授权文件"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            void licenseQuery.refetch();
          }}
          disabled={pending || licenseQuery.isFetching}
        >
          刷新状态
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.lic,.key,text/plain"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {authorized && standalone ? (
        <p className="text-sm text-muted-foreground">
          授权已生效，可以访问{" "}
          <a className="underline" href="./../">
            管理控制台
          </a>
          。
        </p>
      ) : null}
    </div>
  );
}
