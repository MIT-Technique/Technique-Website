/**
 * Site-wide feature toggles. Flip these to re-enable UI without hunting through components.
 */

/** When false, purchase nav buttons stay visible but are not clickable. */
export const YEARBOOK_PURCHASE_ENABLED = false;

export const YEARBOOK_PURCHASE_HREF = "/purchase";

export const YEARBOOK_NAV_ITEMS = [
  {
    href: YEARBOOK_PURCHASE_HREF,
    label: "PURCHASE",
    external: true,
    disabled: !YEARBOOK_PURCHASE_ENABLED,
  },
  { href: "/seniors", label: "SENIORS" },
  { href: "/parents", label: "PARENTS" },
  { href: "/alumni", label: "ALUMNI" },
] as const;
