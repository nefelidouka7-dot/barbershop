export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return (
    url.includes("supabase.co") &&
    !url.includes("your-project") &&
    !url.includes("placeholder") &&
    Boolean(key) &&
    key !== "your-anon-key" &&
    key !== "placeholder"
  );
}
