import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import DocumentUpload from "../DocumentUpload";

// Mock fetch
global.fetch = vi.fn();

describe("DocumentUpload", () => {
  const mockUserId = "test-user-123";
  const mockOnUploadComplete = vi.fn();
  const mockOnUploadError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it("renders upload drop zone", () => {
    render(
      <DocumentUpload
        userId={mockUserId}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );

    expect(screen.getByText(/Drop your PDF here or click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum file size: 50MB/i)).toBeInTheDocument();
  });

  it("shows error for non-PDF files", () => {
    render(
      <DocumentUpload
        userId={mockUserId}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );

    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/Only PDF files are supported/i)).toBeInTheDocument();
    expect(mockOnUploadError).toHaveBeenCalledWith("Only PDF files are supported");
  });

  it("shows error for files larger than 50MB", () => {
    render(
      <DocumentUpload
        userId={mockUserId}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );

    const largeFile = new File(["x".repeat(51 * 1024 * 1024)], "large.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(screen.getByText(/File size must be less than 50MB/i)).toBeInTheDocument();
    expect(mockOnUploadError).toHaveBeenCalledWith("File size must be less than 50MB");
  });

  it("accepts valid PDF file", () => {
    render(
      <DocumentUpload
        userId={mockUserId}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("test.pdf")).toBeInTheDocument();
    expect(screen.getByText(/Upload Document/i)).toBeInTheDocument();
  });

  it("uploads file successfully", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ fileUrl: "https://example.com/file.pdf" }),
    });

    render(
      <DocumentUpload
        userId={mockUserId}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });
    
    const uploadButton = screen.getByText(/Upload Document/i);
    fireEvent.click(uploadButton);

    expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();

    await waitFor(
      () => {
        expect(mockOnUploadComplete).toHaveBeenCalledWith(
          "https://example.com/file.pdf",
          "test.pdf"
        );
      },
      { timeout: 3000 }
    );
  });

  it("handles upload error", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: { message: "Upload failed" } }),
    });

    render(
      <DocumentUpload
        userId={mockUserId}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });
    
    const uploadButton = screen.getByText(/Upload Document/i);
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
      expect(mockOnUploadError).toHaveBeenCalledWith("Upload failed");
    });
  });

  it("allows canceling file selection", () => {
    render(
      <DocumentUpload
        userId={mockUserId}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );

    const file = new File(["pdf content"], "test.pdf", { type: "application/pdf" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText("test.pdf")).toBeInTheDocument();

    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    expect(screen.queryByText("test.pdf")).not.toBeInTheDocument();
    expect(screen.getByText(/Drop your PDF here or click to browse/i)).toBeInTheDocument();
  });

  it("disables upload when disabled prop is true", () => {
    render(
      <DocumentUpload
        userId={mockUserId}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
        disabled={true}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});
