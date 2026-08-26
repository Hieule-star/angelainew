import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/MiniApps";

export const Route = createFileRoute("/mini-apps/")({
  ssr: false,
  component: Page,
});
