import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Onboarding";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  component: Page,
});
