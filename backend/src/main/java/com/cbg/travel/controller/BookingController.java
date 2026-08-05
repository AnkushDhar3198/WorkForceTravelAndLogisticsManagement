package com.cbg.travel.controller;

import com.cbg.travel.entity.Booking;
import com.cbg.travel.service.BookingService;
import com.cbg.travel.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;
    private final AuditService auditService;

    public BookingController(BookingService bookingService, AuditService auditService) {
        this.bookingService = bookingService;
        this.auditService = auditService;
    }

    @GetMapping
    public List<Booking> getAll() {
        return bookingService.getAll();
    }

    @GetMapping("/trip/{travelRequestId}")
    public List<Booking> getByTrip(@PathVariable Long travelRequestId) {
        return bookingService.getByTravelRequest(travelRequestId);
    }

    @GetMapping("/employee/{employeeId}")
    public List<Booking> getByEmployee(@PathVariable Long employeeId) {
        return bookingService.getByEmployee(employeeId);
    }

    @GetMapping("/pnr/{pnrCode}")
    public ResponseEntity<Booking> getByPnr(@PathVariable String pnrCode) {
        return bookingService.getByPnr(pnrCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Booking booking) {
        try {
            Booking created = bookingService.createBooking(booking);

            auditService.log(
                    created.getEmployee().getId(),
                    created.getEmployee().getFullName(),
                    created.getEmployee().getRole().name(),
                    "CREATE", "BOOKING", String.valueOf(created.getId()),
                    "Booked " + created.getBookingType() + " with " + created.getVendorName() +
                    " — PNR: " + created.getPnrCode());

            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Booking updated = bookingService.updateStatus(id, body.get("status"), body.get("notes"));

            auditService.log(
                    updated.getEmployee().getId(),
                    updated.getEmployee().getFullName(),
                    updated.getEmployee().getRole().name(),
                    "UPDATE", "BOOKING", String.valueOf(id),
                    "Booking status changed to " + body.get("status"));

            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
