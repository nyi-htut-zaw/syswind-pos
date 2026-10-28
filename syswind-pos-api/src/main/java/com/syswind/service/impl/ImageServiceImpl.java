package com.syswind.service.impl;

import com.syswind.entity.StoredImage;
import com.syswind.repository.StoredImageRepository;
import com.syswind.service.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ImageServiceImpl implements ImageService {

    @Autowired
    private StoredImageRepository imageRepository;

    @Override
    public StoredImage storeImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "image/jpeg";
        }
        return storeImageBytes(file.getBytes(), file.getOriginalFilename(), contentType);
    }

    @Override
    public StoredImage storeImageBytes(byte[] data, String fileName, String contentType) {
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("Image data cannot be null or empty");
        }
        StoredImage img = new StoredImage(fileName, contentType, data);
        return imageRepository.save(img);
    }

    @Override
    public StoredImage storeBase64Image(String base64Data, String defaultFileName) {
        if (base64Data == null || base64Data.isBlank()) {
            throw new IllegalArgumentException("Base64 string cannot be empty");
        }

        String contentType = "image/jpeg";
        String cleanData = base64Data.trim();

        if (cleanData.contains(",")) {
            String[] parts = cleanData.split(",", 2);
            String header = parts[0];
            cleanData = parts[1];
            if (header.contains("image/png")) {
                contentType = "image/png";
            } else if (header.contains("image/webp")) {
                contentType = "image/webp";
            } else if (header.contains("image/gif")) {
                contentType = "image/gif";
            } else if (header.contains("image/svg+xml")) {
                contentType = "image/svg+xml";
            }
        }

        byte[] bytes = Base64.getDecoder().decode(cleanData);
        return storeImageBytes(bytes, defaultFileName != null ? defaultFileName : "uploaded_image.jpg", contentType);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<StoredImage> getImage(UUID id) {
        return imageRepository.findById(id);
    }

    @Override
    public void deleteImage(UUID id) {
        imageRepository.deleteById(id);
    }
}
