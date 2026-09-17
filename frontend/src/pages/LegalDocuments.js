import { useState } from "react";
import { 
  FileText, 
  Eye, 
  X, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2 
} from "lucide-react";
import { useSiteContent } from "../content";
import PublicLayout from "@/components/PublicLayout";
export default function LegalDocumentsPage() {
  const { content } = useSiteContent();
  const settings = content?.settings || {};
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Documents list matching your attached layout & official details
  const legalDocs = [
    {
      id: "pan",
      title: "Income Tax Department",
      subtitle: "Permanent Account Number (PAN)",
      docNumber: settings.pan_number || "AFEFS6311K",
      category: "Statutory Tax Registration",
      status: "Verified",
      fileUrl: settings.pan_file_url || "#"
    },
    {
      id: "udyam",
      title: "Udyam Registration Certificate",
      subtitle: "Ministry of Micro, Small & Medium Enterprises",
      docNumber: settings.udyam_number || "UDYAM-UP-43-0088526",
      category: "Government Enterprise Registration",
      status: "Active",
      fileUrl: settings.udyam_file_url || "#"
    },
    {
      id: "rera",
      title: "RERA Project Certification",
      subtitle: "Real Estate Regulatory Authority (UP RERA)",
      docNumber: settings.rera_number || "UPRERAPRJ994021",
      category: "Statutory Regulatory Approval",
      status: "Approved",
      fileUrl: settings.rera_file_url || "#"
    },
    {
      id: "incorporation",
      title: "Certificate of Incorporation",
      subtitle: "Ministry of Corporate Affairs (MCA)",
      docNumber: settings.cin_number || "U70109UP2022PTC160412",
      category: "Corporate Registration",
      status: "Verified",
      fileUrl: settings.incorporation_file_url || "#"
    },
    {
      id: "gst",
      title: "Goods & Services Tax (GST)",
      subtitle: "Department of Revenue, Government of India",
      docNumber: settings.gstin || "09AFEFS6311K1ZX",
      category: "Tax Compliance",
      status: "Active",
      fileUrl: settings.gst_file_url || "#"
    }
  ];

  const handleOpenDoc = (doc) => {
    setSelectedDoc(doc);
  };

  const handleCloseModal = () => {
    setSelectedDoc(null);
  };

  return (
    <div className="legal-doc-page">
        <PublicLayout >
      {/* Top Hero Banner */}
      <section className="legal-doc-hero">
        <div className="hero-inner">
          <span className="eyebrow light">Official Transparency</span>
          <h1>Legal <em>Documents</em></h1>
          <p>
            Official government registrations, statutory approvals, and compliance
            certifications for {settings.application_name || "Nirnay Group"}.
          </p>
        </div>
      </section>

      {/* Main Document Listing Container */}
      <section className="legal-doc-container">
        <div className="doc-list-wrapper">
          <div className="doc-list-header">
            <div className="header-badge">
              <ShieldCheck size={18} />
              <span>Certified & Legally Verified</span>
            </div>
            <p className="header-subtitle">
              All documents are maintained under statutory records and are accessible for public validation.
            </p>
          </div>

          <div className="doc-cards-list">
            {legalDocs.map((doc, idx) => (
              <div 
                key={doc.id} 
                className="doc-card"
                style={{ animationDelay: `${idx * 0.12}s` }}
              >
                {/* PDF Emblem on Left */}
                <div className="pdf-emblem-box">
                  <div className="pdf-icon-inner">
                    <FileText className="pdf-svg" size={26} />
                    <span className="pdf-tag">PDF</span>
                  </div>
                </div>

                {/* Document Information */}
                <div className="doc-info-block">
                  <div className="doc-meta-row">
                    <span className="doc-category">{doc.category}</span>
                    <span className="doc-status-tag">
                      <CheckCircle2 size={13} /> {doc.status}
                    </span>
                  </div>
                  <h3 className="doc-title">{doc.title}</h3>
                  <div className="doc-number-line">
                    <span className="doc-label">{doc.subtitle}:</span>{" "}
                    <strong className="doc-val">{doc.docNumber}</strong>
                  </div>
                </div>

                {/* View Action Button on Right */}
                <div className="doc-action-block">
                  <button
                    className="view-doc-btn"
                    onClick={() => handleOpenDoc(doc)}
                    aria-label={`View ${doc.title}`}
                  >
                    <span>View Doc</span>
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Modal Viewer */}
      {selectedDoc && (
        <div className="doc-modal-backdrop" onClick={handleCloseModal}>
          <div 
            className="doc-modal-dialog" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doc-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-sub">{selectedDoc.subtitle}</span>
                <h3>{selectedDoc.title}</h3>
              </div>
              <button 
                className="modal-close-button" 
                onClick={handleCloseModal}
                aria-label="Close document"
              >
                <X size={20} />
              </button>
            </div>

            <div className="doc-modal-body">
              <div className="doc-preview-placeholder">
                <FileText size={64} className="preview-icon" />
                <h4>{selectedDoc.title}</h4>
                <p>Registration No: <strong>{selectedDoc.docNumber}</strong></p>
                <span className="verification-badge">
                  <ShieldCheck size={16} /> Official Record Validated
                </span>
                <p className="preview-help-text">
                  To view or download the complete high-resolution gazette copy, click below.
                </p>
              </div>
            </div>

            <div className="doc-modal-footer">
              <button 
                className="doc-modal-action-btn secondary"
                onClick={handleCloseModal}
              >
                Close
              </button>
              {selectedDoc.fileUrl && selectedDoc.fileUrl !== "#" ? (
                <a
                  href={selectedDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="doc-modal-action-btn primary"
                >
                  <Download size={16} /> Download Copy
                </a>
              ) : (
                <button
                  className="doc-modal-action-btn primary"
                  onClick={() => alert(`A formal copy of ${selectedDoc.title} (${selectedDoc.docNumber}) has been requested.`)}
                >
                  <ExternalLink size={16} /> Request Official Copy
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </PublicLayout>
    </div>
  );
}