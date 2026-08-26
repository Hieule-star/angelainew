import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Install";

export const Route = createFileRoute("/install")({
  ssr: false,
  component: Page,
});
