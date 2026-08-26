import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/LightConstitution";

export const Route = createFileRoute("/light-constitution")({
  ssr: false,
  component: Page,
});
