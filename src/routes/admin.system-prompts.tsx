import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/SystemPromptManager";

export const Route = createFileRoute("/admin/system-prompts")({
  ssr: false,
  component: Page,
});
