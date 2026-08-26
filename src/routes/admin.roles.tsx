import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/RoleManagement";

export const Route = createFileRoute("/admin/roles")({
  ssr: false,
  component: Page,
});
