import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/CTOChat";

export const Route = createFileRoute("/cto")({
  ssr: false,
  component: Page,
});
