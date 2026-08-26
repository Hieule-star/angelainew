import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Integration";

export const Route = createFileRoute("/integration")({
  ssr: false,
  component: Page,
});
