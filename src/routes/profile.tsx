import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Profile";

export const Route = createFileRoute("/profile")({
  ssr: false,
  component: Page,
});
