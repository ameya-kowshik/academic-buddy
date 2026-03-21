import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import FlashcardReview from "../FlashcardReview";

const mockFlashcards = [
  {
    id: "1",
    title: "Test Card 1",
    question: "What is React?",
    answer: "A JavaScript library for building user interfaces",
    grouping: "Frontend",
    difficulty: 3,
    tags: ["react", "javascript"],
    reviewCount: 5,
    lastReviewed: new Date("2024-01-01"),
    sourceMaterial: {
      id: "doc1",
      fileName: "React Basics.pdf",
    },
  },
  {
    id: "2",
    title: "Test Card 2",
    question: "What is TypeScript?",
    answer: "A typed superset of JavaScript",
    grouping: "Frontend",
    difficulty: 2,
    tags: ["typescript"],
    reviewCount: 3,
    lastReviewed: new Date("2024-01-02"),
    sourceMaterial: null,
  },
];

describe("FlashcardReview", () => {
  it("renders the first flashcard", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    expect(screen.getByText("Test Card 1")).toBeInTheDocument();
    expect(screen.getByText("What is React?")).toBeInTheDocument();
    expect(screen.getByText("Card 1 of 2")).toBeInTheDocument();
  });

  it("shows empty state when no flashcards provided", () => {
    render(<FlashcardReview flashcards={[]} />);

    expect(screen.getByText("No flashcards to review")).toBeInTheDocument();
  });

  it("flips card when clicked", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    const card = screen.getByText("What is React?").closest(".absolute");
    expect(card).toBeInTheDocument();

    // Click to flip
    fireEvent.click(card!);

    // Answer should be visible after flip
    expect(
      screen.getByText("A JavaScript library for building user interfaces")
    ).toBeInTheDocument();
  });

  it("navigates to next card", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    expect(screen.getByText("Test Card 1")).toBeInTheDocument();

    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    expect(screen.getByText("Test Card 2")).toBeInTheDocument();
    expect(screen.getByText("Card 2 of 2")).toBeInTheDocument();
  });

  it("navigates to previous card", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    // Go to second card
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    expect(screen.getByText("Test Card 2")).toBeInTheDocument();

    // Go back to first card
    const previousButton = screen.getByRole("button", { name: /previous/i });
    fireEvent.click(previousButton);

    expect(screen.getByText("Test Card 1")).toBeInTheDocument();
  });

  it("disables previous button on first card", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    const previousButton = screen.getByRole("button", { name: /previous/i });
    expect(previousButton).toBeDisabled();
  });

  it("disables next button on last card", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    // Navigate to last card
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    expect(nextButton).toBeDisabled();
  });

  it("calls onReview when review button is clicked", async () => {
    const mockOnReview = vi.fn().mockResolvedValue(undefined);
    render(
      <FlashcardReview flashcards={mockFlashcards} onReview={mockOnReview} />
    );

    // Flip the card first
    const card = screen.getByText("What is React?").closest(".absolute");
    fireEvent.click(card!);

    // Wait for flip animation
    await waitFor(() => {
      expect(
        screen.getByText("A JavaScript library for building user interfaces")
      ).toBeInTheDocument();
    });

    // Click review button
    const reviewButton = screen.getByRole("button", {
      name: /mark as reviewed/i,
    });
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(mockOnReview).toHaveBeenCalledWith("1");
    });
  });

  it("auto-advances to next card after review", async () => {
    const mockOnReview = vi.fn().mockResolvedValue(undefined);
    render(
      <FlashcardReview flashcards={mockFlashcards} onReview={mockOnReview} />
    );

    expect(screen.getByText("Test Card 1")).toBeInTheDocument();

    // Flip the card
    const card = screen.getByText("What is React?").closest(".absolute");
    fireEvent.click(card!);

    // Click review button
    const reviewButton = screen.getByRole("button", {
      name: /mark as reviewed/i,
    });
    fireEvent.click(reviewButton);

    // Should auto-advance to next card after a delay
    await waitFor(
      () => {
        expect(screen.getByText("Test Card 2")).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it("calls onExit when exit button is clicked", () => {
    const mockOnExit = vi.fn();
    render(
      <FlashcardReview flashcards={mockFlashcards} onExit={mockOnExit} />
    );

    const exitButton = screen.getByRole("button", { name: /exit review/i });
    fireEvent.click(exitButton);

    expect(mockOnExit).toHaveBeenCalled();
  });

  it("displays card metadata correctly", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    expect(screen.getByText("Frontend")).toBeInTheDocument();
    expect(screen.getByText("React Basics.pdf")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("javascript")).toBeInTheDocument();
  });

  it("shows difficulty badge with correct label", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    expect(screen.getByText("Medium")).toBeInTheDocument();
  });

  it("updates progress bar as cards are reviewed", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    const progressBar = document.querySelector(
      ".bg-gradient-to-r.from-cyan-600"
    );
    expect(progressBar).toHaveStyle({ width: "50%" });

    // Navigate to next card
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    expect(progressBar).toHaveStyle({ width: "100%" });
  });

  it("handles keyboard navigation - Space to flip", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    expect(screen.getByText("What is React?")).toBeInTheDocument();

    // Press Space to flip
    fireEvent.keyDown(window, { key: " " });

    expect(
      screen.getByText("A JavaScript library for building user interfaces")
    ).toBeInTheDocument();
  });

  it("handles keyboard navigation - Arrow keys", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    expect(screen.getByText("Test Card 1")).toBeInTheDocument();

    // Press ArrowRight to go to next card
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(screen.getByText("Test Card 2")).toBeInTheDocument();

    // Press ArrowLeft to go back
    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(screen.getByText("Test Card 1")).toBeInTheDocument();
  });

  it("handles keyboard navigation - R to review", async () => {
    const mockOnReview = vi.fn().mockResolvedValue(undefined);
    render(
      <FlashcardReview flashcards={mockFlashcards} onReview={mockOnReview} />
    );

    // Flip the card first
    fireEvent.keyDown(window, { key: " " });

    // Press R to review
    fireEvent.keyDown(window, { key: "r" });

    await waitFor(() => {
      expect(mockOnReview).toHaveBeenCalledWith("1");
    });
  });

  it("handles keyboard navigation - Escape to exit", () => {
    const mockOnExit = vi.fn();
    render(
      <FlashcardReview flashcards={mockFlashcards} onExit={mockOnExit} />
    );

    // Press Escape to exit
    fireEvent.keyDown(window, { key: "Escape" });

    expect(mockOnExit).toHaveBeenCalled();
  });

  it("does not trigger keyboard shortcuts when typing in input", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    expect(screen.getByText("Test Card 1")).toBeInTheDocument();

    // Press ArrowRight while focused on input - should not navigate
    fireEvent.keyDown(input, { key: "ArrowRight" });

    expect(screen.getByText("Test Card 1")).toBeInTheDocument();

    document.body.removeChild(input);
  });

  it("resets flip state when navigating between cards", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    // Flip the first card
    const card = screen.getByText("What is React?").closest(".absolute");
    fireEvent.click(card!);

    expect(
      screen.getByText("A JavaScript library for building user interfaces")
    ).toBeInTheDocument();

    // Navigate to next card
    const nextButton = screen.getByRole("button", { name: /next/i });
    fireEvent.click(nextButton);

    // Should show question side of new card (not flipped)
    expect(screen.getByText("What is TypeScript?")).toBeInTheDocument();
  });

  it("displays keyboard shortcuts help", () => {
    render(<FlashcardReview flashcards={mockFlashcards} />);

    expect(screen.getByText("Space")).toBeInTheDocument();
    expect(screen.getByText("Flip card")).toBeInTheDocument();
    expect(screen.getAllByText("Previous")[1]).toBeInTheDocument(); // Get the second "Previous" from shortcuts
    expect(screen.getAllByText("Next")[1]).toBeInTheDocument(); // Get the second "Next" from shortcuts
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Exit")).toBeInTheDocument();
  });

  it("handles review errors gracefully", async () => {
    const mockOnReview = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <FlashcardReview flashcards={mockFlashcards} onReview={mockOnReview} />
    );

    // Flip the card
    const card = screen.getByText("What is React?").closest(".absolute");
    fireEvent.click(card!);

    // Click review button
    const reviewButton = screen.getByRole("button", {
      name: /mark as reviewed/i,
    });
    fireEvent.click(reviewButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error recording review:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it("only shows review button when card is flipped", () => {
    const mockOnReview = vi.fn();
    render(
      <FlashcardReview flashcards={mockFlashcards} onReview={mockOnReview} />
    );

    // Review button should not be visible initially
    expect(
      screen.queryByRole("button", { name: /mark as reviewed/i })
    ).not.toBeInTheDocument();

    // Flip the card
    const card = screen.getByText("What is React?").closest(".absolute");
    fireEvent.click(card!);

    // Review button should now be visible
    expect(
      screen.getByRole("button", { name: /mark as reviewed/i })
    ).toBeInTheDocument();
  });
});
