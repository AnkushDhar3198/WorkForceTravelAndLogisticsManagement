package com.cbg.travel.controller;

import com.cbg.travel.entity.TravelDocument;
import com.cbg.travel.entity.Employee;
import com.cbg.travel.repository.TravelDocumentRepository;
import com.cbg.travel.repository.EmployeeRepository;
import com.cbg.travel.service.AuditService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*")
public class DocumentController {

    private final TravelDocumentRepository documentRepo;
    private final EmployeeRepository employeeRepo;
    private final AuditService auditService;

    public DocumentController(TravelDocumentRepository documentRepo,
                              EmployeeRepository employeeRepo,
                              AuditService auditService) {
        this.documentRepo = documentRepo;
        this.employeeRepo = employeeRepo;
        this.auditService = auditService;
    }

    @GetMapping
    public List<TravelDocument> getAll() {
        return documentRepo.findAllByActiveTrueOrderByUploadedAtDesc();
    }

    @GetMapping("/employee/{employeeId}")
    public List<TravelDocument> getByEmployee(@PathVariable Long employeeId) {
        return documentRepo.findByEmployeeIdAndActiveTrueOrderByUploadedAtDesc(employeeId);
    }

    /**
     * Upload a travel document (US-02).
     * Accepts JSON with Base64-encoded file content.
     * Validates: PDF/JPG/PNG only, max 5MB.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestBody Map<String, Object> payload) {
        try {
            Long employeeId = Long.valueOf(payload.get("employeeId").toString());
            String documentType = (String) payload.get("documentType");
            String fileName = (String) payload.get("fileName");
            String contentType = (String) payload.get("contentType");
            String base64Content = (String) payload.get("content");
            String expiryDateStr = payload.containsKey("expiryDate") ? (String) payload.get("expiryDate") : null;
            String description = payload.containsKey("description") ? (String) payload.get("description") : null;

            // Validate file type
            if (!TravelDocument.isValidFileType(contentType)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Invalid file type. Only PDF, JPG, and PNG files are supported."));
            }

            // Validate file size (Base64 is ~33% larger than binary)
            byte[] decoded = Base64.getDecoder().decode(base64Content);
            if (!TravelDocument.isValidFileSize(decoded.length)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "File size exceeds the 5MB limit."));
            }

            Employee employee = employeeRepo.findById(employeeId)
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

            TravelDocument doc = new TravelDocument();
            doc.setEmployee(employee);
            doc.setDocumentType(documentType);
            doc.setFileName(fileName);
            doc.setFileSize((long) decoded.length);
            doc.setContentType(contentType);
            doc.setEncryptedContent(base64Content);
            doc.setDescription(description);
            if (expiryDateStr != null && !expiryDateStr.isEmpty()) {
                doc.setExpiryDate(LocalDate.parse(expiryDateStr));
            }

            TravelDocument saved = documentRepo.save(doc);

            auditService.log(employeeId, employee.getFullName(), employee.getRole().name(),
                    "CREATE", "DOCUMENT", String.valueOf(saved.getId()),
                    "Uploaded " + documentType + ": " + fileName);

            // Don't return the content in the response to save bandwidth
            saved.setEncryptedContent(null);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> download(@PathVariable Long id) {
        return documentRepo.findById(id)
                .map(doc -> {
                    if (!doc.getActive()) {
                        return ResponseEntity.notFound().build();
                    }
                    return ResponseEntity.ok(Map.of(
                            "fileName", doc.getFileName(),
                            "contentType", doc.getContentType(),
                            "content", doc.getEncryptedContent()
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> replace(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return documentRepo.findById(id)
                .map(existing -> {
                    try {
                        String base64Content = (String) payload.get("content");
                        String contentType = (String) payload.get("contentType");
                        String fileName = (String) payload.get("fileName");

                        if (contentType != null && !TravelDocument.isValidFileType(contentType)) {
                            return ResponseEntity.badRequest()
                                    .body(Map.of("message", "Invalid file type."));
                        }

                        if (base64Content != null) {
                            byte[] decoded = Base64.getDecoder().decode(base64Content);
                            if (!TravelDocument.isValidFileSize(decoded.length)) {
                                return ResponseEntity.badRequest()
                                        .body(Map.of("message", "File exceeds 5MB limit."));
                            }
                            existing.setEncryptedContent(base64Content);
                            existing.setFileSize((long) decoded.length);
                        }
                        if (contentType != null) existing.setContentType(contentType);
                        if (fileName != null) existing.setFileName(fileName);
                        if (payload.containsKey("expiryDate")) {
                            String ed = (String) payload.get("expiryDate");
                            existing.setExpiryDate(ed != null && !ed.isEmpty() ? LocalDate.parse(ed) : null);
                        }
                        if (payload.containsKey("description")) {
                            existing.setDescription((String) payload.get("description"));
                        }

                        TravelDocument saved = documentRepo.save(existing);
                        saved.setEncryptedContent(null);

                        auditService.log(existing.getEmployee().getId(),
                                existing.getEmployee().getFullName(),
                                existing.getEmployee().getRole().name(),
                                "UPDATE", "DOCUMENT", String.valueOf(id),
                                "Replaced document: " + existing.getFileName());

                        return ResponseEntity.ok(saved);
                    } catch (Exception e) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Replace failed: " + e.getMessage()));
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return documentRepo.findById(id)
                .map(existing -> {
                    existing.setActive(false);
                    documentRepo.save(existing);

                    auditService.log(existing.getEmployee().getId(),
                            existing.getEmployee().getFullName(),
                            existing.getEmployee().getRole().name(),
                            "DELETE", "DOCUMENT", String.valueOf(id),
                            "Deleted document: " + existing.getFileName());

                    return ResponseEntity.ok(Map.of("message", "Document deleted"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
