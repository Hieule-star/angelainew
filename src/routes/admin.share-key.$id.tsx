import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/admin/ShareKey";

export const Route = createFileRoute("/admin/share-key/$id")({
  ssr: false,
  component: Page,
});
