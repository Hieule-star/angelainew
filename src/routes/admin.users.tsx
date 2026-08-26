import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/UserManagement";

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  component: Page,
});
