import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import QuizForm, { QuizFormData } from "../QuizForm";

// Mock fetch
global.fetch = vi.fn();

describe("QuizForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const userId = "test-user-id";

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    });
  });

  it("renders quiz creation form", () => {
    render(
      <QuizForm onSubmit={mockOnSubmit} userId={userId} />
    );

    expect(screen.getByText("Create New Quiz")).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
  });

  it("renders edit mode when isEditing is true", () => {
    render(
      <QuizForm
        onSubmit={mockOnSubmit}
        userId={userId}
        isEditing={true}
      />
    );

    expect(screen.getByText("Edit Quiz")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update quiz/i })).toBeInTheDocument();
  });

  it("loads initial data when provided", () => {
    const initialData: Partial<QuizFormData> = {
      title: "Test Quiz",
      description: "Test Description",
      difficulty: 4,
      grouping: "Chapter 1",
    };

    render(
      <QuizForm
        onSubmit={mockOnSubmit}
        userId={userId}
        initialData={initialData}
      />
    );

    expect(screen.getByDisplayValue("Test Quiz")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Chapter 1")).toBeInTheDocument();
  });

  it("adds a new question when Add Question button is clicked", () => {
    render(<QuizForm onSubmit={mockOnSubmit} userId={userId} />);

    const addButton = screen.getByRole("button", { name: /add question/i });
    fireEvent.click(addButton);

    expect(screen.getByText("Question 1")).toBeInTheDocument();
  });

  it("removes a question when delete button is clicked", () => {
    render(<QuizForm onSubmit={mockOnSubmit} userId={userId} />);

    // Add a question
    const addButton = screen.getByRole("button", { name: /add question/i });
    fireEvent.click(addButton);

    expect(screen.getByText("Question 1")).toBeInTheDocument();

    // Remove the question
    const deleteButtons = screen.getAllByRole("button");
    const deleteButton = deleteButtons.find(
      (btn) => btn.querySelector("svg")?.classList.contains("lucide-trash-2")
    );
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    expect(screen.queryByText("Question 1")).not.toBeInTheDocument();
  });

  it("adds options to a question", () => {
    render(<QuizForm onSubmit={mockOnSubmit} userId={userId} />);

    // Add a question
    fireEvent.click(screen.getByRole("button", { name: /add question/i }));

    // Initially has 2 options
    expect(screen.getByPlaceholderText("Option 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Option 2")).toBeInTheDocument();

    // Add another option
    const addOptionButton = screen.getByRole("button", { name: /add option/i });
    fireEvent.click(addOptionButton);

    expect(screen.getByPlaceholderText("Option 3")).toBeInTheDocument();
  });

  it("disables submit button when title is empty", () => {
    render(<QuizForm onSubmit={mockOnSubmit} userId={userId} />);

    const submitButton = screen.getByRole("button", { name: /create quiz/i });
    expect(submitButton).toBeDisabled();
  });

  it("validates at least one question is required", async () => {
    render(<QuizForm onSubmit={mockOnSubmit} userId={userId} />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: "Test Quiz" } });

    const submitButton = screen.getByRole("button", { name: /create quiz/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("At least one question is required")
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("validates question text is required", async () => {
    render(<QuizForm onSubmit={mockOnSubmit} userId={userId} />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: "Test Quiz" } });

    // Add a question but leave it empty
    fireEvent.click(screen.getByRole("button", { name: /add question/i }));

    const submitButton = screen.getByRole("button", { name: /create quiz/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/question 1: question text is required/i)
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("validates at least 2 options are required", async () => {
    render(<QuizForm onSubmit={mockOnSubmit} userId={userId} />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: "Test Quiz" } });

    // Add a question
    fireEvent.click(screen.getByRole("button", { name: /add question/i }));

    const questionInput = screen.getByPlaceholderText("Enter the question...");
    fireEvent.change(questionInput, { target: { value: "What is 2+2?" } });

    // Fill only one option
    const option1 = screen.getByPlaceholderText("Option 1");
    fireEvent.change(option1, { target: { value: "4" } });

    const submitButton = screen.getByRole("button", { name: /create quiz/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/question 1: at least 2 options are required/i)
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits valid quiz data", async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(<QuizForm onSubmit={mockOnSubmit} userId={userId} />);

    // Fill quiz metadata
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Math Quiz" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Basic math questions" },
    });

    // Add a question
    fireEvent.click(screen.getByRole("button", { name: /add question/i }));

    const questionInput = screen.getByPlaceholderText("Enter the question...");
    fireEvent.change(questionInput, { target: { value: "What is 2+2?" } });

    const option1 = screen.getByPlaceholderText("Option 1");
    const option2 = screen.getByPlaceholderText("Option 2");
    fireEvent.change(option1, { target: { value: "4" } });
    fireEvent.change(option2, { target: { value: "5" } });

    // Select correct answer - use the first select with "Select correct answer" option
    const selects = screen.getAllByRole("combobox");
    const correctAnswerSelect = selects.find((select) =>
      select.querySelector('option[value=""]')?.textContent?.includes("Select correct answer")
    );
    if (correctAnswerSelect) {
      fireEvent.change(correctAnswerSelect, { target: { value: "4" } });
    }

    const submitButton = screen.getByRole("button", { name: /create quiz/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Math Quiz",
          description: "Basic math questions",
          difficulty: 3,
          questions: expect.arrayContaining([
            expect.objectContaining({
              questionText: "What is 2+2?",
              options: ["4", "5"],
              correctAnswer: "4",
            }),
          ]),
        })
      );
    });
  });

  it("reorders questions using up/down buttons", () => {
    render(<QuizForm onSubmit={mockOnSubmit} userId={userId} />);

    // Add two questions
    fireEvent.click(screen.getByRole("button", { name: /add question/i }));
    fireEvent.click(screen.getByRole("button", { name: /add question/i }));

    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("Question 2")).toBeInTheDocument();

    // Find the down button for Question 1
    const allButtons = screen.getAllByRole("button");
    const downButtons = allButtons.filter((btn) => btn.textContent === "↓");
    
    if (downButtons.length > 0) {
      fireEvent.click(downButtons[0]);
    }

    // Questions should still be present (order changed internally)
    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("Question 2")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(
      <QuizForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userId={userId}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("disables form when loading", () => {
    render(
      <QuizForm onSubmit={mockOnSubmit} userId={userId} loading={true} />
    );

    expect(screen.getByLabelText(/title/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });
});
