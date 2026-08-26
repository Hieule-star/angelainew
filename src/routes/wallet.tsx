import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Wallet";

export const Route = createFileRoute("/wallet")({
  ssr: false,
  component: Page,
});
