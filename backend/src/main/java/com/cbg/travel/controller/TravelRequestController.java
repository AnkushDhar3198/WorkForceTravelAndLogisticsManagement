package com.cbg.travel.controller;

import com.cbg.travel.entity.TravelRequest;
import com.cbg.travel.entity.TravelRequestStatus;
import com.cbg.travel.service.TravelRequestService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/travel-requests")
@CrossOrigin(origins = "*")
public class TravelRequestController {

    private final TravelRequestService service;

    public TravelRequestController(TravelRequestService service) {
        this.service = service;
    }

    @GetMapping
    public List<TravelRequest> getAll() {
        return service.getAllRequests();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TravelRequest> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/employee/{employeeId}")
    public List<TravelRequest> getByEmployee(@PathVariable Long employeeId) {
        return service.getByEmployee(employeeId);
    }

    @GetMapping("/pending")
    public List<TravelRequest> getPending() {
        return service.getPendingForApproval();
    }

    @PostMapping
    public ResponseEntity<TravelRequest> create(@RequestBody TravelRequest request) {
        try {
            TravelRequest created = service.createRequest(request);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TravelRequest> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            TravelRequestStatus status = TravelRequestStatus.valueOf(body.get("status"));
            Long approverId = body.containsKey("approverId") ? Long.valueOf(body.get("approverId")) : null;
            String remarks = body.get("remarks");

            TravelRequest updated = service.updateStatus(id, status, approverId, remarks);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
