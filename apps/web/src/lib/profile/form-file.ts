export function readSelectedProfilePhotoFile(formData: FormData, key: string) {
  if (formData.get(`${key}_selected`) !== "1") return null;

  const value = formData.get(key);
  return value instanceof File ? value : null;
}
