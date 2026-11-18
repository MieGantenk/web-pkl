import { navigation, roleHome, type Role } from "@/lib/navigation";

export function isNavActive(pathname: string, href: string, role: Role) {
  if (href === roleHome[role]) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getPageTitle(role: Role, pathname: string) {
  const items = navigation[role];
  const flat = items.flatMap((item) => [item, ...(item.children ?? [])]);

  const match = flat
    .filter((item) => isNavActive(pathname, item.href, role))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.label ?? "Sistem PKL";
}
