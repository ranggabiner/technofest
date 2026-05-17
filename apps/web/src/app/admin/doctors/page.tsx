import { redirect } from "next/navigation";

export default function AdminDoctorsRedirectPage() {
  redirect("/admin/approval");
}
