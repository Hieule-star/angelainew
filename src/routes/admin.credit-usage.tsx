import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/CreditUsage";

export const Route = createFileRoute("/admin/credit-usage")({
  ssr: false,
  component: Page,
});
