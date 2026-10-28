package com.syswind.controller;

import com.syswind.entity.StoredImage;
import com.syswind.service.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
public class ImageController {

    @Autowired
    private ImageService imageService;

    @GetMapping("/api/images/{id}")
    public ResponseEntity<byte[]> serveImage(@PathVariable("id") String idStr) {
        try {
            UUID id = UUID.fromString(idStr);
            Optional<StoredImage> opt = imageService.getImage(id);
            if (opt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            StoredImage image = opt.get();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(image.getContentType()));
            headers.setContentLength(image.getSizeBytes());
            headers.setCacheControl("public, max-age=86400"); // Cache 1 day

            return new ResponseEntity<>(image.getData(), headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/api/upload")
    public ResponseEntity<Map<String, Object>> uploadImage(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            StoredImage saved;
            if (file != null && !file.isEmpty()) {
                saved = imageService.storeImage(file);
            } else if (body != null && body.containsKey("image")) {
                String base64 = (String) body.get("image");
                String name = (String) body.getOrDefault("name", "upload.jpg");
                saved = imageService.storeBase64Image(base64, name);
            } else {
                resp.put("success", false);
                resp.put("message", "No file or base64 image data provided");
                return ResponseEntity.badRequest().body(resp);
            }

            String url = "/api/images/" + saved.getId();
            resp.put("success", true);
            resp.put("message", "Image saved directly to database as binary byte data");
            resp.put("url", url);
            resp.put("id", saved.getId().toString());
            resp.put("size", saved.getSizeBytes());
            resp.put("contentType", saved.getContentType());
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "Upload failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }
}
