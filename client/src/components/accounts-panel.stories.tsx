import type { Meta, StoryObj } from "@storybook/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AccountsPanel } from "./accounts-panel";

const meta: Meta<typeof AccountsPanel> = {
  title: "Components/AccountsPanel",
  component: AccountsPanel,
};

export default meta;

type Story = StoryObj<typeof AccountsPanel>;

export const Default: Story = {
  render: () => (
    <QueryClientProvider client={queryClient}>
      <AccountsPanel />
    </QueryClientProvider>
  ),
};
