package com.cbg.travel.controller;

import com.cbg.travel.entity.Vendor;
import com.cbg.travel.repository.VendorRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@CrossOrigin(origins = "*")
public class VendorController {

    private final VendorRepository vendorRepo;

    public VendorController(VendorRepository vendorRepo) {
        this.vendorRepo = vendorRepo;
    }

    @GetMapping
    public List<Vendor> getAll() {
        return vendorRepo.findByActiveTrue();
    }

    @GetMapping("/preferred")
    public List<Vendor> getPreferred() {
        return vendorRepo.findByPreferredTrueAndActiveTrue();
    }

    @GetMapping("/category/{category}")
    public List<Vendor> getByCategory(@PathVariable String category) {
        return vendorRepo.findByCategoryAndActiveTrue(category.toUpperCase());
    }

    @PostMapping
    public Vendor create(@RequestBody Vendor vendor) {
        return vendorRepo.save(vendor);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vendor> update(@PathVariable Long id, @RequestBody Vendor updated) {
        return vendorRepo.findById(id)
                .map(existing -> {
                    existing.setName(updated.getName());
                    existing.setCategory(updated.getCategory());
                    existing.setCorporateRate(updated.getCorporateRate());
                    existing.setStandardRate(updated.getStandardRate());
                    existing.setRating(updated.getRating());
                    existing.setPreferred(updated.getPreferred());
                    existing.setBadges(updated.getBadges());
                    existing.setRegion(updated.getRegion());
                    return ResponseEntity.ok(vendorRepo.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
