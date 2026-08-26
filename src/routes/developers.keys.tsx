import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/DeveloperKeys";

export const Route = createFileRoute("/developers/keys")({
  ssr: false,
  component: Page,
});
