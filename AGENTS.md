<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Listings, regions and house options live in `src/lib/data.ts` as static data; move to the database when landlords start adding listings.
- Per-account hunt progress is saved in localStorage keyed `kijang:<userId>:<key>` via `src/lib/userStore.ts`; profile fields live in the `profiles` table.
- Maps use keyless OpenStreetMap embeds and Nominatim/Overpass lookups from the browser, to avoid key setup.
- Admin access is a UI gate, not an auth role: approved emails live in `public.admin_emails` (service_role only), 6-digit codes in `public.admin_access_codes` (hashed, 10-min expiry), verified via `src/lib/admin.functions.ts`; the admin session token is kept in sessionStorage as `keja_admin`.
