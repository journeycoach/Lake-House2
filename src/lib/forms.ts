export function readText(value: FormDataEntryValue | null, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}
