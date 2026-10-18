
export function parseDevice(userAgent: string | undefined): string {
  const ua = userAgent || "";
  const lower = ua.toLowerCase();

  const type = /mobile|android|iphone|ipad|tablet/i.test(lower) ? "mobile" : "desktop";

  let brand = "";
  if (/iphone|ipad/i.test(lower)) brand = "Apple iPhone/iPad";
  else if (/macintosh|mac os/i.test(lower)) brand = "Apple Mac";
  else if (/samsung|galaxy/i.test(lower)) brand = "Samsung";
  else if (/xiaomi|redmi|poco/i.test(lower)) brand = "Xiaomi";
  else if (/huawei|honor/i.test(lower)) brand = "Huawei";
  else if (/oppo|realme|oneplus/i.test(lower)) brand = "Oppo/OnePlus";
  else if (/vivo/i.test(lower)) brand = "Vivo";
  else if (/pixel/i.test(lower)) brand = "Google Pixel";
  else if (/tecno|infinix|itel/i.test(lower)) brand = "Tecno/Infinix";
  else if (/windows/i.test(lower)) brand = "Windows PC";
  else if (/linux/i.test(lower)) brand = "Linux";
  else if (/android/i.test(lower)) brand = "Android";

  if (!brand) return type === "mobile" ? "Appareil mobile" : "Ordinateur";
  return type === "mobile" ? `${brand} (mobile)` : brand;
}