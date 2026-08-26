import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/docs/InternalAuth";

export const Route = createFileRoute("/docs/internal-auth")({
  ssr: false,
  component: Page,
});
