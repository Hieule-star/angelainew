import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/MiniAppQuotas";

export const Route = createFileRoute("/admin/mini-app-quotas")({
  ssr: false,
  component: Page,
});
