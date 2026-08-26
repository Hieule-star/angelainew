import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Developers";

export const Route = createFileRoute("/developers/")({
  ssr: false,
  component: Page,
});
