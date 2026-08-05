package com.cbg.travel.repository;

import com.cbg.travel.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByTravelRequestIdOrderByCreatedAtDesc(Long travelRequestId);
    List<Booking> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<Booking> findAllByOrderByCreatedAtDesc();
    Optional<Booking> findByPnrCode(String pnrCode);
    List<Booking> findByStatusOrderByCreatedAtDesc(String status);
}
