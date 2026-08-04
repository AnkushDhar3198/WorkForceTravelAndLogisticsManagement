package com.cbg.travel.controller;

import com.cbg.travel.entity.Shipment;
import com.cbg.travel.repository.ShipmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shipments")
@CrossOrigin(origins = "*")
public class ShipmentController {

    private final ShipmentRepository shipmentRepo;

    public ShipmentController(ShipmentRepository shipmentRepo) {
        this.shipmentRepo = shipmentRepo;
    }

    @GetMapping
    public List<Shipment> getAll() {
        return shipmentRepo.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shipment> getById(@PathVariable Long id) {
        return shipmentRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tracking/{code}")
    public ResponseEntity<Shipment> getByTrackingCode(@PathVariable String code) {
        return shipmentRepo.findByTrackingCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Shipment create(@RequestBody Shipment shipment) {
        return shipmentRepo.save(shipment);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Shipment> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return shipmentRepo.findById(id)
                .map(existing -> {
                    existing.setStatus(body.get("status"));
                    if (body.containsKey("notes")) existing.setNotes(body.get("notes"));
                    return ResponseEntity.ok(shipmentRepo.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
