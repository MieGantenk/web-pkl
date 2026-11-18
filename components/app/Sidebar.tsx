import type { Role } from "@/lib/navigation";
import type { Profile } from "@/lib/profile";

import { SidebarContent } from "./SidebarContent";

export function Sidebar({
  role,
  profile,
}: {
  role: Role;
  profile: Profile;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-full flex-col bg-sidebar lg:flex">
      <SidebarContent role={role} profile={profile} scope="desktop" />
    </aside>
  );
}
