package com.cbg.travel.repository;

import com.cbg.travel.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    List<Vendor> findByActiveTrue();
    List<Vendor> findByCategoryAndActiveTrue(String category);
    List<Vendor> findByPreferredTrueAndActiveTrue();
}
