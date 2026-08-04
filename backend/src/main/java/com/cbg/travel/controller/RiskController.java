package com.cbg.travel.controller;

import com.cbg.travel.entity.TravelerLocation;
import com.cbg.travel.repository.TravelerLocationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/risk")
@CrossOrigin(origins = "*")
public class RiskController {

    private final TravelerLocationRepository locationRepo;

    public RiskController(TravelerLocationRepository locationRepo) {
        this.locationRepo = locationRepo;
    }

    @GetMapping("/travelers")
    public List<TravelerLocation> getAll() {
        return locationRepo.findAllByOrderByLastUpdatedDesc();
    }

    @GetMapping("/travelers/{employeeId}")
    public ResponseEntity<TravelerLocation> getByEmployee(@PathVariable Long employeeId) {
        return locationRepo.findByEmployeeId(employeeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/travelers")
    public TravelerLocation createOrUpdate(@RequestBody TravelerLocation location) {
        location.setLastUpdated(LocalDateTime.now());
        return locationRepo.save(location);
    }

    @PutMapping("/travelers/{id}/status")
    public ResponseEntity<TravelerLocation> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return locationRepo.findById(id)
                .map(existing -> {
                    if (body.containsKey("status")) existing.setStatus(body.get("status"));
                    if (body.containsKey("threatLevel")) existing.setThreatLevel(body.get("threatLevel"));
                    if (body.containsKey("advisoryNotes")) existing.setAdvisoryNotes(body.get("advisoryNotes"));
                    existing.setLastUpdated(LocalDateTime.now());
                    return ResponseEntity.ok(locationRepo.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/sos")
    public ResponseEntity<Map<String, Object>> triggerSos(@RequestBody Map<String, Object> payload) {
        Long employeeId = payload.containsKey("employeeId") ? Long.valueOf(payload.get("employeeId").toString()) : null;
        String status = "EMERGENCY_DISPATCHED";

        if (employeeId != null) {
            locationRepo.findByEmployeeId(employeeId).ifPresent(loc -> {
                loc.setStatus("ASSISTANCE_REQUESTED");
                loc.setLastUpdated(LocalDateTime.now());
                locationRepo.save(loc);
            });
        }

        return ResponseEntity.ok(Map.of(
                "status", status,
                "message", "Emergency assistance team dispatched",
                "dispatchTime", LocalDateTime.now().toString()
        ));
    }
}
