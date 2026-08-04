package com.cbg.travel.repository;

import com.cbg.travel.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findBySyncedEmployeeIdOrderByTargetDeliveryDateAsc(Long employeeId);
    List<Shipment> findByStatusOrderByTargetDeliveryDateAsc(String status);
    Optional<Shipment> findByTrackingCode(String trackingCode);
    List<Shipment> findAllByOrderByCreatedAtDesc();
}
