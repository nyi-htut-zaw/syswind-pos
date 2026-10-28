package com.syswind.service;

import com.syswind.entity.StoredImage;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

public interface ImageService {
    StoredImage storeImage(MultipartFile file) throws IOException;
    StoredImage storeImageBytes(byte[] data, String fileName, String contentType);
    StoredImage storeBase64Image(String base64Data, String defaultFileName);
    Optional<StoredImage> getImage(UUID id);
    void deleteImage(UUID id);
}
