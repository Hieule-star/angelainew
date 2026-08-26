import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Knowledge";

export const Route = createFileRoute("/knowledge")({
  ssr: false,
  component: Page,
});
