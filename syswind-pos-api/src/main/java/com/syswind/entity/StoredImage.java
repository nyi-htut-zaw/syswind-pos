package com.syswind.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "images")
public class StoredImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.VARBINARY)
    @Column(name = "data", columnDefinition = "bytea", nullable = false)
    private byte[] data;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public StoredImage() {}

    public StoredImage(String fileName, String contentType, byte[] data) {
        this.fileName = fileName;
        this.contentType = contentType != null ? contentType : "image/jpeg";
        this.data = data;
        this.sizeBytes = data != null ? (long) data.length : 0L;
        this.createdAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }

    public byte[] getData() { return data; }
    public void setData(byte[] data) {
        this.data = data;
        this.sizeBytes = data != null ? (long) data.length : 0L;
    }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
