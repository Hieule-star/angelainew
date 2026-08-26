import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/ApiKeys";

export const Route = createFileRoute("/admin/api-keys")({
  ssr: false,
  component: Page,
});
