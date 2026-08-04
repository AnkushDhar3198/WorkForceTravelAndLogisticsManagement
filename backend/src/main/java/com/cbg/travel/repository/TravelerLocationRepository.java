package com.cbg.travel.repository;

import com.cbg.travel.entity.TravelerLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TravelerLocationRepository extends JpaRepository<TravelerLocation, Long> {
    Optional<TravelerLocation> findByEmployeeId(Long employeeId);
    List<TravelerLocation> findByThreatLevelIn(List<String> threatLevels);
    List<TravelerLocation> findAllByOrderByLastUpdatedDesc();
}
