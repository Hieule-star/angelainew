import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/KnowledgeUpload";

export const Route = createFileRoute("/admin/knowledge")({
  ssr: false,
  component: Page,
});
