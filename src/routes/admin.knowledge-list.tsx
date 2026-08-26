import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/KnowledgeList";

export const Route = createFileRoute("/admin/knowledge-list")({
  ssr: false,
  component: Page,
});
