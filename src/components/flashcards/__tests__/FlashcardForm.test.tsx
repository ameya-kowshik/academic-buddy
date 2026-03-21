import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import FlashcardForm from '../FlashcardForm';
import { FlashcardFormData } from '../FlashcardForm';

// Mock fetch
global.fetch = vi.fn();

describe('FlashcardForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: [] }),
    });
  });

  it('renders form with all required fields', async () => {
    render(
      <FlashcardForm
        onSubmit={mockOnSubmit}
        userId={mockUserId}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/question/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/answer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/grouping/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/link to document/i)).toBeInTheDocument();
    });
  });

  it('validates required fields on submit', async () => {
    render(
      <FlashcardForm
        onSubmit={mockOnSubmit}
        userId={mockUserId}
      />
    );

    // Try to submit with empty title
    const titleInput = screen.getByLabelText(/title/i);
    const submitButton = screen.getByRole('button', { name: /create flashcard/i });
    
    // Button should be disabled when form is empty
    expect(submitButton).toBeDisabled();
    
    // Fill in question and answer but leave title empty
    fireEvent.change(screen.getByLabelText(/question/i), {
      target: { value: 'Question' },
    });
    fireEvent.change(screen.getByLabelText(/answer/i), {
      target: { value: 'Answer' },
    });
    
    // Button should still be disabled without title
    expect(submitButton).toBeDisabled();
    
    // Now add title
    fireEvent.change(titleInput, {
      target: { value: 'Test' },
    });
    
    // Button should now be enabled
    expect(submitButton).not.toBeDisabled();
  });

  it('submits form with valid data', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <FlashcardForm
        onSubmit={mockOnSubmit}
        userId={mockUserId}
      />
    );

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Flashcard' },
    });
    fireEvent.change(screen.getByLabelText(/question/i), {
      target: { value: 'What is 2+2?' },
    });
    fireEvent.change(screen.getByLabelText(/answer/i), {
      target: { value: '4' },
    });

    const submitButton = screen.getByRole('button', { name: /create flashcard/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Flashcard',
          question: 'What is 2+2?',
          answer: '4',
          difficulty: 3,
        })
      );
    });
  });

  it('validates difficulty range', async () => {
    render(
      <FlashcardForm
        onSubmit={mockOnSubmit}
        userId={mockUserId}
      />
    );

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByLabelText(/question/i), {
      target: { value: 'Question' },
    });
    fireEvent.change(screen.getByLabelText(/answer/i), {
      target: { value: 'Answer' },
    });

    // Select difficulty
    const difficultySelect = screen.getByLabelText(/difficulty/i);
    fireEvent.change(difficultySelect, { target: { value: '5' } });

    const submitButton = screen.getByRole('button', { name: /create flashcard/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          difficulty: 5,
        })
      );
    });
  });

  it('fetches and displays documents for linking', async () => {
    const mockDocuments = [
      { id: 'doc1', fileName: 'Document 1.pdf' },
      { id: 'doc2', fileName: 'Document 2.pdf' },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ documents: mockDocuments }),
    });

    render(
      <FlashcardForm
        onSubmit={mockOnSubmit}
        userId={mockUserId}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/documents');
    });

    await waitFor(() => {
      const select = screen.getByLabelText(/link to document/i);
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Document 1.pdf')).toBeInTheDocument();
      expect(screen.getByText('Document 2.pdf')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <FlashcardForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        userId={mockUserId}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('displays error message on submit failure', async () => {
    const errorMessage = 'Failed to create flashcard';
    mockOnSubmit.mockRejectedValue(new Error(errorMessage));

    render(
      <FlashcardForm
        onSubmit={mockOnSubmit}
        userId={mockUserId}
      />
    );

    // Fill in form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByLabelText(/question/i), {
      target: { value: 'Question' },
    });
    fireEvent.change(screen.getByLabelText(/answer/i), {
      target: { value: 'Answer' },
    });

    const submitButton = screen.getByRole('button', { name: /create flashcard/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('populates form with initial data when editing', async () => {
    const initialData: Partial<FlashcardFormData> = {
      title: 'Existing Flashcard',
      question: 'What is the capital of France?',
      answer: 'Paris',
      difficulty: 4,
      grouping: 'Geography',
    };

    render(
      <FlashcardForm
        onSubmit={mockOnSubmit}
        initialData={initialData}
        isEditing={true}
        userId={mockUserId}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Flashcard')).toBeInTheDocument();
      expect(screen.getByDisplayValue('What is the capital of France?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Geography')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /update flashcard/i })).toBeInTheDocument();
  });

  it('resets form after successful creation', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <FlashcardForm
        onSubmit={mockOnSubmit}
        userId={mockUserId}
      />
    );

    // Fill in form
    const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
    const questionInput = screen.getByLabelText(/question/i) as HTMLTextAreaElement;
    const answerInput = screen.getByLabelText(/answer/i) as HTMLTextAreaElement;

    fireEvent.change(titleInput, { target: { value: 'Test' } });
    fireEvent.change(questionInput, { target: { value: 'Question' } });
    fireEvent.change(answerInput, { target: { value: 'Answer' } });

    const submitButton = screen.getByRole('button', { name: /create flashcard/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Check form is reset
    await waitFor(() => {
      expect(titleInput.value).toBe('');
      expect(questionInput.value).toBe('');
      expect(answerInput.value).toBe('');
    });
  });
});
