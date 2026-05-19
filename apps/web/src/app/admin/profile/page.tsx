import { RoleProfilePage } from "@/app/_components/role-profile-page";

export const dynamic = "force-dynamic";

export default function AdminProfilePage() {
  return <RoleProfilePage routeRole="admin" />;
}
