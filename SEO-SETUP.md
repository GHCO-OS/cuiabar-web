# SEO Setup Notes

## Sprint 1 operational steps

These steps depend on external services and must be completed outside the repository after deploy.

## Cloudflare Pages

### `robots.txt`

- Deploy the repository changes that add `functions/robots.txt.js`.
- After deploy, verify that `https://cuiabar.com/robots.txt` is serving the app-controlled response.
- If Cloudflare managed content still overrides the file, disable the managed override for the apex site.

## Google Search Console

### Preferred method

- Verify the domain property by DNS in Search Console.

### Repository-supported method

- Set the Pages build environment variable `GOOGLE_SITE_VERIFICATION`.
- Rebuild and deploy.
- The build script will inject `<meta name="google-site-verification" ...>` into generated HTML.

## Google baseline

- Submit `https://cuiabar.com/sitemap.xml` in Search Console.
- Link Search Console to GA4.
- Link GA4 to Google Ads.
- Confirm that the Google tag on the site is attached to the intended GA4 property and Ads destination.

## Meta baseline

- Confirm `META_PIXEL_ID` and `META_CAPI_TOKEN` are set in Cloudflare Pages production.
- Validate `https://cuiabar.com/api/meta-conversions`.

## Legacy URL cleanup

- After deploy, request removals for stale legacy URLs in Search Console where needed.
- Prioritize `/services-5`, `/online-ordering`, and any additional legacy paths with impressions.
