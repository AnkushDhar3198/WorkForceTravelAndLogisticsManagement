package com.cbg.travel.repository;

import com.cbg.travel.entity.PolicyRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PolicyRuleRepository extends JpaRepository<PolicyRule, Long> {
    List<PolicyRule> findByActiveTrue();
    List<PolicyRule> findByRuleTypeAndActiveTrue(String ruleType);
    List<PolicyRule> findByRegionCodeAndActiveTrue(String regionCode);
}
