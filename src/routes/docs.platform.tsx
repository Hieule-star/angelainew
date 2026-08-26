import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/docs/Platform";

export const Route = createFileRoute("/docs/platform")({
  ssr: false,
  component: Page,
});
