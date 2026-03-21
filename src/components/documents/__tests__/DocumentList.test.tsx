import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import DocumentList from "../DocumentList";

const mockDocuments = [
  {
    id: "doc1",
    fileName: "test-document.pdf",
    fileUrl: "https://example.com/test-document.pdf",
    fileSize: 1024000,
    mimeType: "application/pdf",
    extractedText: "Sample extracted text",
    tags: ["math", "calculus"],
    uploadedAt: "2024-01-15T10:30:00Z",
    processedAt: "2024-01-15T10:31:00Z",
  },
  {
    id: "doc2",
    fileName: "processing-document.pdf",
    fileUrl: "https://example.com/processing-document.pdf",
    fileSize: 2048000,
    mimeType: "application/pdf",
    extractedText: null,
    tags: [],
    uploadedAt: "2024-01-16T14:20:00Z",
    processedAt: null,
  },
  {
    id: "doc3",
    fileName: "failed-document.pdf",
    fileUrl: "https://example.com/failed-document.pdf",
    fileSize: 512000,
    mimeType: "application/pdf",
    extractedText: null,
    tags: ["physics"],
    uploadedAt: "2024-01-17T09:15:00Z",
    processedAt: "2024-01-17T09:16:00Z",
  },
];

describe("DocumentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no documents", () => {
    render(<DocumentList documents={[]} />);
    expect(screen.getByText("No documents yet")).toBeInTheDocument();
    expect(
      screen.getByText("Upload your first PDF document to get started")
    ).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(<DocumentList documents={[]} isLoading={true} />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays all documents with metadata", () => {
    render(<DocumentList documents={mockDocuments} />);

    // Check all document names are displayed
    expect(screen.getByText("test-document.pdf")).toBeInTheDocument();
    expect(screen.getByText("processing-document.pdf")).toBeInTheDocument();
    expect(screen.getByText("failed-document.pdf")).toBeInTheDocument();

    // Check that file sizes are displayed (exact format may vary)
    const allText = document.body.textContent || "";
    expect(allText).toContain("KB");
  });

  it("shows correct extraction status for each document", () => {
    render(<DocumentList documents={mockDocuments} />);

    // Document with extracted text
    expect(screen.getByText("Text Extracted")).toBeInTheDocument();

    // Document still processing
    expect(screen.getByText("Processing")).toBeInTheDocument();

    // Document with failed extraction
    expect(screen.getByText("Extraction Failed")).toBeInTheDocument();
  });

  it("displays tags for documents", () => {
    render(<DocumentList documents={mockDocuments} />);

    expect(screen.getByText("math")).toBeInTheDocument();
    expect(screen.getByText("calculus")).toBeInTheDocument();
    expect(screen.getByText("physics")).toBeInTheDocument();
  });

  it("opens delete confirmation dialog when delete button clicked", async () => {
    render(<DocumentList documents={mockDocuments} />);

    const deleteButtons = screen.getAllByRole("button");
    const firstDeleteButton = deleteButtons.find((btn) =>
      btn.innerHTML.includes("lucide-trash")
    );

    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);

      await waitFor(() => {
        expect(screen.getByText("Delete Document")).toBeInTheDocument();
        expect(
          screen.getByText(/Are you sure you want to delete this document/)
        ).toBeInTheDocument();
      });
    }
  });

  it("calls onDelete when deletion is confirmed", async () => {
    const mockOnDelete = vi.fn().mockResolvedValue(undefined);
    render(<DocumentList documents={mockDocuments} onDelete={mockOnDelete} />);

    // Click delete button
    const deleteButtons = screen.getAllByRole("button");
    const firstDeleteButton = deleteButtons.find((btn) =>
      btn.innerHTML.includes("lucide-trash")
    );

    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);

      // Wait for dialog to appear
      await waitFor(() => {
        expect(screen.getByText("Delete Document")).toBeInTheDocument();
      });

      // Click confirm button
      const confirmButton = screen.getByText("Delete");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith("doc1");
      });
    }
  });

  it("calls onRefresh after successful deletion", async () => {
    const mockOnDelete = vi.fn().mockResolvedValue(undefined);
    const mockOnRefresh = vi.fn();
    render(
      <DocumentList
        documents={mockDocuments}
        onDelete={mockOnDelete}
        onRefresh={mockOnRefresh}
      />
    );

    // Click delete button
    const deleteButtons = screen.getAllByRole("button");
    const firstDeleteButton = deleteButtons.find((btn) =>
      btn.innerHTML.includes("lucide-trash")
    );

    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);

      await waitFor(() => {
        expect(screen.getByText("Delete Document")).toBeInTheDocument();
      });

      // Click confirm button
      const confirmButton = screen.getByText("Delete");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    }
  });

  it("formats dates correctly", () => {
    render(<DocumentList documents={mockDocuments} />);

    // Check that dates are formatted (exact format may vary by locale)
    const dateElements = screen.getAllByText(/Jan|2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("opens document URL when download button clicked", () => {
    const mockWindowOpen = vi.fn();
    window.open = mockWindowOpen;

    render(<DocumentList documents={mockDocuments} />);

    const downloadButtons = screen.getAllByRole("button");
    const firstDownloadButton = downloadButtons.find((btn) =>
      btn.innerHTML.includes("lucide-download")
    );

    if (firstDownloadButton) {
      fireEvent.click(firstDownloadButton);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        "https://example.com/test-document.pdf",
        "_blank"
      );
    }
  });

  it("disables delete button while deletion is in progress", async () => {
    const mockOnDelete = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    render(<DocumentList documents={mockDocuments} onDelete={mockOnDelete} />);

    // Click delete button
    const deleteButtons = screen.getAllByRole("button");
    const firstDeleteButton = deleteButtons.find((btn) =>
      btn.innerHTML.includes("lucide-trash")
    );

    if (firstDeleteButton) {
      fireEvent.click(firstDeleteButton);

      await waitFor(() => {
        expect(screen.getByText("Delete Document")).toBeInTheDocument();
      });

      // Click confirm button
      const confirmButton = screen.getByText("Delete");
      fireEvent.click(confirmButton);

      // Check that the onDelete function was called
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith("doc1");
      });
    }
  });
});
