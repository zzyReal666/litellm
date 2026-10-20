import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RoutingStrategySelector from "./RoutingStrategySelector";

const openStrategyDropdown = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("combobox"));

const baseProps = {
  selectedStrategy: null,
  availableStrategies: ["simple-shuffle", "latency-based-routing", "least-busy"],
  routingStrategyDescriptions: {
    "simple-shuffle": "Randomly pick a deployment",
    "latency-based-routing": "Pick the lowest-latency deployment",
  },
  routerFieldsMetadata: {},
  onStrategyChange: vi.fn(),
};

describe("RoutingStrategySelector", () => {
  it("should render", () => {
    render(<RoutingStrategySelector {...baseProps} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should display default label when no metadata is provided", () => {
    render(<RoutingStrategySelector {...baseProps} />);
    expect(screen.getByText("Routing Strategy")).toBeInTheDocument();
  });

  it("should prefer the translated label over a label supplied by field metadata", () => {
    const props = {
      ...baseProps,
      routerFieldsMetadata: {
        routing_strategy: {
          ui_field_name: "Legacy Label",
          field_description: "Legacy description",
        },
      },
    };
    render(<RoutingStrategySelector {...props} />);
    expect(screen.getByText("Routing Strategy")).toBeInTheDocument();
    expect(screen.queryByText("Legacy Label")).not.toBeInTheDocument();
  });

  it("should render all available strategies as options", async () => {
    const user = userEvent.setup();
    render(<RoutingStrategySelector {...baseProps} />);

    await openStrategyDropdown(user);

    expect(await screen.findByRole("option", { name: /simple-shuffle/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /latency-based-routing/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /least-busy/ })).toBeInTheDocument();
  });

  it("should display strategy descriptions alongside option labels", async () => {
    const user = userEvent.setup();
    render(<RoutingStrategySelector {...baseProps} />);

    await openStrategyDropdown(user);

    expect(await screen.findByText("Randomly picks a deployment from the list. Simple and fast.")).toBeInTheDocument();
    expect(
      screen.getByText("Routes to the deployment with the lowest latency over a sliding window."),
    ).toBeInTheDocument();
  });

  it("should fall back to the backend description for a strategy the catalog does not cover", async () => {
    const user = userEvent.setup();
    const props = {
      ...baseProps,
      availableStrategies: ["custom-strategy"],
      routingStrategyDescriptions: { "custom-strategy": "Custom strategy description" },
    };
    render(<RoutingStrategySelector {...props} />);

    await openStrategyDropdown(user);

    expect(await screen.findByText("Custom strategy description")).toBeInTheDocument();
  });

  it("should not render a description for a strategy that has none", async () => {
    const user = userEvent.setup();
    render(<RoutingStrategySelector {...baseProps} />);

    await openStrategyDropdown(user);

    // "least-busy" has no entry in routingStrategyDescriptions - it still offers the bare option
    expect(await screen.findByRole("option", { name: "least-busy" })).toBeInTheDocument();
  });

  it("should call onStrategyChange with the selected strategy value", async () => {
    const onStrategyChange = vi.fn();
    const user = userEvent.setup();
    render(<RoutingStrategySelector {...baseProps} onStrategyChange={onStrategyChange} />);

    await openStrategyDropdown(user);
    await user.click(await screen.findByRole("option", { name: /latency-based-routing/ }));

    expect(onStrategyChange).toHaveBeenCalledWith("latency-based-routing");
  });
});
