import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("doctor document upload form", () => {
  const source = readFileSync(
    new URL("./step-2/doctor-document-upload-form.tsx", import.meta.url),
    "utf8",
  );
  const step3Source = readFileSync(
    new URL("./step-3/page.tsx", import.meta.url),
    "utf8",
  );
  const previewSource = readFileSync(
    new URL("../../../components/kyc-document-preview.tsx", import.meta.url),
    "utf8",
  );

  it("keeps every upload state inside one fixed-size surface", () => {
    expect(source).toContain('data-upload-surface="doctor-kyc-document"');
    expect(source).toContain("kycDocumentCompactPreviewSurfaceClassName");
    expect(previewSource).toContain("h-[140px]");
    expect(previewSource).not.toContain("min-h-[140px]");
    expect(source).not.toContain("<KycDocumentPreview");
  });

  it("reuses the same compact preview surface on Step 2 and Step 3", () => {
    expect(source).toContain("KycDocumentCompactPreviewContent");
    expect(source).toContain("kycDocumentCompactPreviewSurfaceClassName");
    expect(step3Source).toContain("KycDocumentCompactPreview");
    expect(step3Source).not.toContain("<KycDocumentPreview");
    expect(step3Source).toContain("max-w-xl");
  });

  it("connects the full upload surface to the hidden file input", () => {
    expect(source).toContain("const inputId = `${document.documentType}-file`;");
    expect(source).toContain('role="button"');
    expect(source).toContain("tabIndex={surfaceDisabled ? -1 : 0}");
    expect(source).toContain("onKeyDown={handleSurfaceKeyDown}");
    expect(source).toContain("absolute inset-0 z-10 h-full w-full cursor-pointer opacity-[0.01]");
    expect(source).not.toContain('className="sr-only"');
  });

  it("supports drag and drop on the same upload surface", () => {
    expect(source).toContain("const [isDraggingOver, setIsDraggingOver] = useState(false)");
    expect(source).toContain("onDragEnter={handleDragEnter}");
    expect(source).toContain("onDragOver={handleDragOver}");
    expect(source).toContain("onDragLeave={handleDragLeave}");
    expect(source).toContain("onDrop={handleDrop}");
    expect(source).toContain("const file = event.dataTransfer.files.item(0)");
    expect(source).toContain("void processSelectedFile(file)");
  });

  it("validates manual and dropped files before using the upload action", () => {
    expect(source).toContain('import { validateKycFile } from "@/lib/kyc/files";');
    expect(source).toContain("async function processSelectedFile(documentType: KycDocumentType, file: File)");
    expect(source).toContain("const validation = validateKycFile(file);");
    expect(source).toContain("[documentType]: copy.uploadErrors[validation.reason]");
    expect(source).toContain("await uploadDocument(documentType, file);");
  });

  it("keys previews by latest uploaded file id so replacements refresh immediately", () => {
    expect(source).toContain('import { getKycDocumentPreviewUrl } from "@/lib/kyc/preview";');
    expect(source).toContain("const previewUrl = getKycDocumentPreviewUrl(document);");
    expect(source).toContain("key={previewUrl}");
    expect(step3Source).toContain('import { getKycDocumentPreviewUrl } from "@/lib/kyc/preview";');
    expect(step3Source).toContain("const previewUrl = getKycDocumentPreviewUrl(document);");
    expect(step3Source).toContain("key={previewUrl}");
  });

  it("shows top-right success feedback after confirmed document mutations", () => {
    expect(source).toContain('import { AppToast } from "@/components/ui/app-toast";');
    expect(source).toContain("setUploadToastKey((key) => key + 1)");
    expect(source).toContain("message={copy.uploadPreview.uploadSuccess}");
    expect(source).toContain('router.push("/doctor/onboarding/step-3?save_status=doctor_documents_review")');
    expect(step3Source).toContain("SaveStatusToast");
    expect(step3Source).toContain("messages={copy.common.successToast}");
  });
});
