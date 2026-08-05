package com.cbg.travel.controller;

import com.cbg.travel.entity.Notification;
import com.cbg.travel.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationRepository notificationRepo;

    public NotificationController(NotificationRepository notificationRepo) {
        this.notificationRepo = notificationRepo;
    }

    @GetMapping
    public List<Notification> getAll() {
        return notificationRepo.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/unread/{employeeId}")
    public List<Notification> getUnread(@PathVariable Long employeeId) {
        return notificationRepo.findByTargetEmployeeIdAndReadStatusFalseOrderByCreatedAtDesc(employeeId);
    }

    @PostMapping
    public Notification create(@RequestBody Notification notification) {
        return notificationRepo.save(notification);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return notificationRepo.findById(id)
                .map(n -> {
                    n.setReadStatus(true);
                    return ResponseEntity.ok(notificationRepo.save(n));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        List<Notification> all = notificationRepo.findAll();
        all.forEach(n -> n.setReadStatus(true));
        notificationRepo.saveAll(all);
        return ResponseEntity.ok(java.util.Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearReadNotifications() {
        List<Notification> readList = notificationRepo.findAll().stream()
                .filter(Notification::getReadStatus)
                .toList();
        notificationRepo.deleteAll(readList);
        return ResponseEntity.ok(java.util.Map.of("message", "Cleared read notifications"));
    }
}
