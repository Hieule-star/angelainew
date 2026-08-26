import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Login";

export const Route = createFileRoute("/login")({
  ssr: false,
  component: Page,
});
