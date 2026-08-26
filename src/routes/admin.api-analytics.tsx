import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/ApiAnalytics";

export const Route = createFileRoute("/admin/api-analytics")({
  ssr: false,
  component: Page,
});
