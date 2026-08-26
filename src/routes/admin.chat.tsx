import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/ChatAnalytics";

export const Route = createFileRoute("/admin/chat")({
  ssr: false,
  component: Page,
});
