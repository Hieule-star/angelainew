import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/RagDebug";

export const Route = createFileRoute("/admin/rag-debug")({
  ssr: false,
  component: Page,
});
