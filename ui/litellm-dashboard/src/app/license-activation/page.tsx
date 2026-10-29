import ProductLicensePanel from "@/components/product_license/ProductLicensePanel";

export default function LicenseActivationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-3xl rounded-xl bg-background p-6 shadow-sm ring-1 ring-foreground/10 sm:p-8">
        <ProductLicensePanel standalone />
      </div>
    </div>
  );
}
