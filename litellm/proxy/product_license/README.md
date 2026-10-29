# Software license (product authorization)

The AI Token gateway requires a valid software license before it serves traffic. The license
is bound to the machine by `liblicense.so` and stored locally as a hex text file.

This feature is independent from the LiteLLM Enterprise license (`LITELLM_LICENSE`).

## Machine-readable API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/product/license/info` | Current authorization status and display fields (product name/version, product serial number, machine code, status, validity period, authorization date, licensed users/threads) |
| `GET` | `/product/license/request` | Download the authorization request code as hex text (`product_license_request.txt`) |
| `POST` | `/product/license/import` | Upload the license response file (multipart field `file`, hex text) |

These endpoints stay reachable while the gateway is unauthorized so the activation page can
finish the authorization. Licenses are signed for the requesting machine by the vendor, so
uploading one cannot unlock another machine.

## Authorization workflow

1. Start the gateway. Unauthorized deployments serve only `/ui/license-activation/`, the
   login page, health checks and the license endpoints. Everything else returns `403` with
   `type: product_not_authorized`.
2. Open `/ui/license-activation/` and download the authorization request code.
3. Send the request file to the vendor and receive the license response file.
4. Upload the response file on the same page. The gateway imports it into the software device,
   persists it, and unlocks the product.
5. `/ui/product-license` (Settings > 授权信息) shows the authorization details afterwards.

The request/import hex format matches the vendor `liblicense.so` contract, so the existing
license issuing tooling keeps working.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `LITELLM_PRODUCT_LICENSE_ENABLED` | `true` | Enforcement switch. Set `false` only for local development. |
| `LITELLM_PRODUCT_LICENSE_FILE` | `./product_license.lic` | Where the imported license response is persisted. Point it at a mounted volume in containers. |
| `LITELLM_PRODUCT_LICENSE_LIB` | bundled `lib` dir, then common paths | Explicit path to `liblicense.so`. |
| `LITELLM_PRODUCT_NAME` | `AI Token网关` | Product name shown in the license details. |
| `LITELLM_PRODUCT_VERSION` | LiteLLM package version | Product version shown in the license details. |
| `LITELLM_PRODUCT_SERIAL` | machine fingerprint | Override the displayed product serial number. |
| `LITELLM_PRODUCT_CODE` | `ai-token-gateway` | Server type sent with the authorization request. |

`liblicense.so` is bundled at `litellm/proxy/product_license/lib/liblicense.so` (Linux
x86-64). Machine binding is enforced inside the library: the vendor signs the license against
the request code generated on this host. The details page additionally shows a product serial
number derived from the machine fingerprint (CPU/board serials, or the OS machine id), which
is stable across restarts and useful when matching a host to a purchase record. Override it
with `LITELLM_PRODUCT_SERIAL` when the purchase record has its own serial.

## Layout

- `native_backend.py` - `ctypes` bindings for `liblicense.so` and the fixed-size license info struct.
- `subprocess_backend.py` - request generation and license import run in an isolated worker process.
  The vendor library can segfault when an invalid license response is imported after a request code
  was generated in the same process; a worker keeps such a crash from taking the proxy down.
- `native_worker.py` - the short-lived worker entrypoint (`python -m litellm.proxy.product_license.native_worker`).
- `manager.py` - status evaluation, caching, request generation, import and persistence.
- `middleware.py` - blocks product traffic until authorized, redirects UI traffic to the activation page.
- `router.py` - the HTTP endpoints above.
- `fingerprint.py` - product serial number / machine code.
