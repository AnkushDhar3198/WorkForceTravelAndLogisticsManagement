package com.cbg.travel.service;

import com.cbg.travel.entity.*;
import com.cbg.travel.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
public class BookingService {

    private final BookingRepository bookingRepo;
    private final TravelRequestRepository travelRequestRepo;
    private final EmployeeRepository employeeRepo;
    private final VendorRepository vendorRepo;
    private final NotificationRepository notificationRepo;

    public BookingService(BookingRepository bookingRepo,
                          TravelRequestRepository travelRequestRepo,
                          EmployeeRepository employeeRepo,
                          VendorRepository vendorRepo,
                          NotificationRepository notificationRepo) {
        this.bookingRepo = bookingRepo;
        this.travelRequestRepo = travelRequestRepo;
        this.employeeRepo = employeeRepo;
        this.vendorRepo = vendorRepo;
        this.notificationRepo = notificationRepo;
    }

    public List<Booking> getAll() {
        return bookingRepo.findAllByOrderByCreatedAtDesc();
    }

    public List<Booking> getByTravelRequest(Long travelRequestId) {
        return bookingRepo.findByTravelRequestIdOrderByCreatedAtDesc(travelRequestId);
    }

    public List<Booking> getByEmployee(Long employeeId) {
        return bookingRepo.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
    }

    public Optional<Booking> getByPnr(String pnrCode) {
        return bookingRepo.findByPnrCode(pnrCode);
    }

    /**
     * Create a booking — only allowed for APPROVED travel requests (US-08 AC1).
     */
    public Booking createBooking(Booking booking) {
        // Validate travel request exists and is approved
        TravelRequest tr = booking.getTravelRequest();
        if (tr == null || tr.getId() == null) {
            throw new IllegalArgumentException("Travel request is required");
        }

        TravelRequest travelRequest = travelRequestRepo.findById(tr.getId())
                .orElseThrow(() -> new IllegalArgumentException("Travel request not found: " + tr.getId()));

        if (travelRequest.getStatus() != TravelRequestStatus.APPROVED &&
            travelRequest.getStatus() != TravelRequestStatus.COMPLETED) {
            throw new IllegalArgumentException("Bookings can only be created for approved travel requests. Current status: " + travelRequest.getStatus());
        }

        booking.setTravelRequest(travelRequest);

        // Resolve employee
        Employee employee = booking.getEmployee();
        if (employee != null && employee.getId() != null) {
            employee = employeeRepo.findById(employee.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
            booking.setEmployee(employee);
        } else {
            booking.setEmployee(travelRequest.getEmployee());
        }

        // Auto-generate PNR if not set
        if (booking.getPnrCode() == null || booking.getPnrCode().isEmpty()) {
            booking.setPnrCode(Booking.generatePNR());
        }

        if (booking.getBookingDate() == null) {
            booking.setBookingDate(LocalDate.now());
        }

        if (booking.getStatus() == null) {
            booking.setStatus("CONFIRMED");
        }

        Booking saved = bookingRepo.save(booking);

        // Create notification for the traveler
        Notification notification = new Notification();
        notification.setTitle("Booking Confirmed — " + saved.getBookingType());
        notification.setMessage("Your " + saved.getBookingType().toLowerCase() + " booking with " +
                saved.getVendorName() + " is confirmed. PNR: " + saved.getPnrCode());
        notification.setSeverity("INFO");
        notification.setCategory("SYSTEM");
        notification.setTargetEmployee(saved.getEmployee());
        notificationRepo.save(notification);

        return saved;
    }

    public Booking updateStatus(Long id, String status, String notes) {
        Booking booking = bookingRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + id));
        booking.setStatus(status);
        if (notes != null) booking.setNotes(notes);
        return bookingRepo.save(booking);
    }
}
