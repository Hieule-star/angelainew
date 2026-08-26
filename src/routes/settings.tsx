import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Settings";

export const Route = createFileRoute("/settings")({
  ssr: false,
  component: Page,
});
