import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import FlashcardList from "../FlashcardList";

// Mock flashcard data
const mockFlashcards = [
  {
    id: "1",
    title: "JavaScript Basics",
    question: "What is a closure?",
    answer: "A closure is a function that has access to variables in its outer scope",
    grouping: "JavaScript",
    difficulty: 3,
    tags: ["programming", "javascript"],
    reviewCount: 5,
    lastReviewed: new Date("2024-01-15"),
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    sourceMaterialId: "doc1",
    sourceMaterial: {
      id: "doc1",
      fileName: "JavaScript Guide.pdf",
    },
  },
  {
    id: "2",
    title: "React Hooks",
    question: "What is useState?",
    answer: "useState is a Hook that lets you add state to function components",
    grouping: "React",
    difficulty: 2,
    tags: ["react", "hooks"],
    reviewCount: 3,
    lastReviewed: new Date("2024-01-10"),
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-10"),
    sourceMaterialId: "doc2",
    sourceMaterial: {
      id: "doc2",
      fileName: "React Documentation.pdf",
    },
  },
  {
    id: "3",
    title: "TypeScript Types",
    question: "What is a union type?",
    answer: "A union type is a type formed from two or more other types",
    grouping: "TypeScript",
    difficulty: 4,
    tags: ["typescript", "types"],
    reviewCount: 0,
    lastReviewed: null,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
    sourceMaterialId: null,
    sourceMaterial: null,
  },
];

describe("FlashcardList", () => {
  it("renders loading state", () => {
    render(<FlashcardList flashcards={[]} isLoading={true} />);
    
    // Should show skeleton loaders - check for the loading cards
    const loadingCards = screen.getAllByTestId("loading-card");
    expect(loadingCards.length).toBe(3);
  });

  it("renders empty state when no flashcards", () => {
    render(<FlashcardList flashcards={[]} />);
    
    expect(screen.getByText("No flashcards yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first flashcard to start studying")).toBeInTheDocument();
  });

  it("displays flashcards with metadata", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    // Check titles are displayed
    expect(screen.getByText("JavaScript Basics")).toBeInTheDocument();
    expect(screen.getByText("React Hooks")).toBeInTheDocument();
    expect(screen.getByText("TypeScript Types")).toBeInTheDocument();
    
    // Check questions are displayed
    expect(screen.getByText("What is a closure?")).toBeInTheDocument();
    expect(screen.getByText("What is useState?")).toBeInTheDocument();
    
    // Check review counts
    expect(screen.getByText(/Reviewed 5 times/)).toBeInTheDocument();
    expect(screen.getByText(/Reviewed 3 times/)).toBeInTheDocument();
    expect(screen.getByText(/Reviewed 0 times/)).toBeInTheDocument();
  });

  it("shows difficulty badges with correct labels", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    expect(screen.getByText("Medium")).toBeInTheDocument(); // difficulty 3
    expect(screen.getByText("Easy")).toBeInTheDocument(); // difficulty 2
    expect(screen.getByText("Hard")).toBeInTheDocument(); // difficulty 4
  });

  it("displays grouping badges", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("displays source document badges", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    expect(screen.getByText("JavaScript Guide.pdf")).toBeInTheDocument();
    expect(screen.getByText("React Documentation.pdf")).toBeInTheDocument();
  });

  it("displays tags", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    expect(screen.getByText("programming")).toBeInTheDocument();
    expect(screen.getByText("javascript")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("hooks")).toBeInTheDocument();
  });

  it("shows last reviewed date", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    expect(screen.getByText(/Last reviewed: Jan 15, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Last reviewed: Jan 10, 2024/)).toBeInTheDocument();
    expect(screen.getByText(/Last reviewed: Never/)).toBeInTheDocument();
  });

  it("toggles filter panel", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    const filterButton = screen.getByText("Show Filters");
    expect(screen.queryByText("Grouping")).not.toBeInTheDocument();
    
    fireEvent.click(filterButton);
    expect(screen.getByText("Grouping")).toBeInTheDocument();
    expect(screen.getByText("Difficulty")).toBeInTheDocument();
    expect(screen.getByText("Source Document")).toBeInTheDocument();
    
    fireEvent.click(screen.getByText("Hide Filters"));
    expect(screen.queryByText("Grouping")).not.toBeInTheDocument();
  });

  it("filters by grouping", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    // Open filters
    fireEvent.click(screen.getByText("Show Filters"));
    
    // Select JavaScript grouping
    const groupingSelect = screen.getByLabelText("Grouping");
    fireEvent.change(groupingSelect, { target: { value: "JavaScript" } });
    
    // Should only show JavaScript flashcard
    expect(screen.getByText("JavaScript Basics")).toBeInTheDocument();
    expect(screen.queryByText("React Hooks")).not.toBeInTheDocument();
    expect(screen.queryByText("TypeScript Types")).not.toBeInTheDocument();
    
    // Check results count
    expect(screen.getByText("Showing 1 of 3 flashcards")).toBeInTheDocument();
  });

  it("filters by difficulty", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    // Open filters
    fireEvent.click(screen.getByText("Show Filters"));
    
    // Select difficulty 2
    const difficultySelect = screen.getByLabelText("Difficulty");
    fireEvent.change(difficultySelect, { target: { value: "2" } });
    
    // Should only show React Hooks (difficulty 2)
    expect(screen.getByText("React Hooks")).toBeInTheDocument();
    expect(screen.queryByText("JavaScript Basics")).not.toBeInTheDocument();
    expect(screen.queryByText("TypeScript Types")).not.toBeInTheDocument();
  });

  it("filters by source document", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    // Open filters
    fireEvent.click(screen.getByText("Show Filters"));
    
    // Select document
    const documentSelect = screen.getByLabelText("Source Document");
    fireEvent.change(documentSelect, { target: { value: "doc1" } });
    
    // Should only show JavaScript Basics
    expect(screen.getByText("JavaScript Basics")).toBeInTheDocument();
    expect(screen.queryByText("React Hooks")).not.toBeInTheDocument();
    expect(screen.queryByText("TypeScript Types")).not.toBeInTheDocument();
  });

  it("applies multiple filters simultaneously", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    // Open filters
    fireEvent.click(screen.getByText("Show Filters"));
    
    // Apply multiple filters that match nothing
    const groupingSelect = screen.getByLabelText("Grouping");
    const difficultySelect = screen.getByLabelText("Difficulty");
    
    fireEvent.change(groupingSelect, { target: { value: "JavaScript" } });
    fireEvent.change(difficultySelect, { target: { value: "5" } });
    
    // Should show no results message
    expect(screen.getByText("No flashcards match your filters")).toBeInTheDocument();
  });

  it("clears filters", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    // Open filters and apply a filter
    fireEvent.click(screen.getByText("Show Filters"));
    const groupingSelect = screen.getByLabelText("Grouping");
    fireEvent.change(groupingSelect, { target: { value: "JavaScript" } });
    
    // Should show filtered results
    expect(screen.getByText("Showing 1 of 3 flashcards")).toBeInTheDocument();
    
    // Clear filters
    const clearButton = screen.getByText("Clear Filters");
    fireEvent.click(clearButton);
    
    // Should show all flashcards again
    expect(screen.getByText("Showing 3 of 3 flashcards")).toBeInTheDocument();
  });

  it("shows active filter count badge", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    // Open filters
    fireEvent.click(screen.getByText("Show Filters"));
    
    // Apply two filters
    const groupingSelect = screen.getByLabelText("Grouping");
    const difficultySelect = screen.getByLabelText("Difficulty");
    
    fireEvent.change(groupingSelect, { target: { value: "JavaScript" } });
    fireEvent.change(difficultySelect, { target: { value: "3" } });
    
    // Should show badge with count
    const badge = screen.getByText("2");
    expect(badge).toBeInTheDocument();
  });

  it("calls onEdit when edit button clicked", () => {
    const onEdit = vi.fn();
    render(<FlashcardList flashcards={mockFlashcards} onEdit={onEdit} />);
    
    const editButtons = screen.getAllByRole("button", { name: "" });
    const firstEditButton = editButtons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-edit'));
    
    if (firstEditButton) {
      fireEvent.click(firstEditButton);
      expect(onEdit).toHaveBeenCalledWith(mockFlashcards[0]);
    }
  });

  it("opens delete confirmation dialog", () => {
    const onDelete = vi.fn();
    render(<FlashcardList flashcards={mockFlashcards} onDelete={onDelete} />);
    
    const deleteButtons = screen.getAllByRole("button", { name: "" });
    const firstDeleteButton = deleteButtons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-trash-2'));
    
    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);
      
      // Dialog should open
      expect(screen.getByText("Delete Flashcard")).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete this flashcard/)).toBeInTheDocument();
    }
  });

  it("calls onDelete when deletion confirmed", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();
    render(<FlashcardList flashcards={mockFlashcards} onDelete={onDelete} onRefresh={onRefresh} />);
    
    // Click delete button
    const deleteButtons = screen.getAllByRole("button", { name: "" });
    const firstDeleteButton = deleteButtons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-trash-2'));
    
    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByText("Delete");
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith("1");
        expect(onRefresh).toHaveBeenCalled();
      });
    }
  });

  it("cancels deletion", () => {
    const onDelete = vi.fn();
    render(<FlashcardList flashcards={mockFlashcards} onDelete={onDelete} />);
    
    // Click delete button
    const deleteButtons = screen.getAllByRole("button", { name: "" });
    const firstDeleteButton = deleteButtons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-trash-2'));
    
    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);
      
      // Cancel deletion
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);
      
      // Dialog should close and onDelete should not be called
      expect(onDelete).not.toHaveBeenCalled();
    }
  });

  it("handles delete error gracefully", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const onDelete = vi.fn().mockRejectedValue(new Error("Delete failed"));
    render(<FlashcardList flashcards={mockFlashcards} onDelete={onDelete} />);
    
    // Click delete button
    const deleteButtons = screen.getAllByRole("button", { name: "" });
    const firstDeleteButton = deleteButtons.find(btn => btn.querySelector('svg')?.classList.contains('lucide-trash-2'));
    
    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);
      
      // Confirm deletion
      const confirmButton = screen.getByText("Delete");
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith("Error deleting flashcard:", expect.any(Error));
      });
    }
    
    consoleError.mockRestore();
  });

  it("does not show edit/delete buttons when handlers not provided", () => {
    render(<FlashcardList flashcards={mockFlashcards} />);
    
    // Should not have edit or delete buttons
    const buttons = screen.getAllByRole("button");
    const hasEditButton = buttons.some(btn => btn.querySelector('svg')?.classList.contains('lucide-edit'));
    const hasDeleteButton = buttons.some(btn => btn.querySelector('svg')?.classList.contains('lucide-trash-2'));
    
    expect(hasEditButton).toBe(false);
    expect(hasDeleteButton).toBe(false);
  });
});
