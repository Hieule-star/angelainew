import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/MiniAppBuilder";

export const Route = createFileRoute("/mini-apps/$id")({
  ssr: false,
  component: Page,
});
