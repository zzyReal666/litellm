import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import DecisionModelsBanner from "./DecisionModelsBanner";

const STORAGE_KEY = "hideDecisionModelsBanner";

describe("DecisionModelsBanner", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("hideCostOptimizationFeedbackBanner");
  });

  it("links directly to the Decisions playground", () => {
    render(<DecisionModelsBanner />);
    const link = screen.getByRole("link", { name: "Try decision models" });
    expect(link).toHaveAttribute("href", "/ui/playground?tab=system-one");
  });

  it("does not render external documentation links", () => {
    render(<DecisionModelsBanner />);
    expect(screen.queryByRole("link", { name: "How to call them" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Supported providers" })).not.toBeInTheDocument();
    expect(screen.getByRole("paragraph")).toHaveTextContent("Call them at /v1/decisions or /v1/systemone");
  });

  it("shows the announcement even if the old feedback banner was dismissed", () => {
    localStorage.setItem("hideCostOptimizationFeedbackBanner", "true");
    render(<DecisionModelsBanner />);
    expect(screen.getByText("Decision models are now supported")).toBeInTheDocument();
  });

  it("hides itself and persists the dismissal when the dismiss button is clicked", () => {
    render(<DecisionModelsBanner />);
    expect(screen.getByText("Decision models are now supported")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Dismiss banner"));

    expect(screen.queryByText("Decision models are now supported")).not.toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("stays dismissed on remount once persisted", () => {
    localStorage.setItem(STORAGE_KEY, "true");
    render(<DecisionModelsBanner />);
    expect(screen.queryByText("Decision models are now supported")).not.toBeInTheDocument();
  });
});
