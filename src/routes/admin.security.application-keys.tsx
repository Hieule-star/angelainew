import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/ApplicationKeys";

export const Route = createFileRoute("/admin/security/application-keys")({
  ssr: false,
  component: Page,
});
