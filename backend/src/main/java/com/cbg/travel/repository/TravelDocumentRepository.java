package com.cbg.travel.repository;

import com.cbg.travel.entity.TravelDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TravelDocumentRepository extends JpaRepository<TravelDocument, Long> {
    List<TravelDocument> findByEmployeeIdAndActiveTrueOrderByUploadedAtDesc(Long employeeId);
    List<TravelDocument> findByEmployeeIdAndDocumentTypeAndActiveTrueOrderByUploadedAtDesc(Long employeeId, String documentType);
    List<TravelDocument> findAllByActiveTrueOrderByUploadedAtDesc();
}
