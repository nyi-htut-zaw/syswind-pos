package com.syswind.controller;

import com.syswind.config.SecurityHelper;
import com.syswind.entity.Category;
import com.syswind.entity.Product;
import com.syswind.entity.ProductVariant;
import com.syswind.entity.User;
import com.syswind.repository.CategoryRepository;
import com.syswind.repository.ProductRepository;
import com.syswind.repository.ProductVariantRepository;
import com.syswind.repository.StoredImageRepository;
import com.syswind.service.AuditService;
import com.syswind.specification.ProductSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private StoredImageRepository imageRepository;

    @Autowired
    private SecurityHelper securityHelper;

    @Autowired
    private AuditService auditService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "category_id", required = false) String categoryIdStr,
            @RequestParam(value = "low_stock", required = false) Boolean lowStockOnly
    ) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            UUID orgId = (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole()) && currentUser.getOrganization() != null)
                    ? currentUser.getOrganization().getId() : null;

            UUID categoryId = null;
            if (categoryIdStr != null && !categoryIdStr.isBlank()) {
                try { categoryId = UUID.fromString(categoryIdStr); } catch (Exception ignored) {}
            }

            // JPA Criteria Query using ProductSpecification
            List<Product> products = productRepository.findAll(
                    ProductSpecification.filter(search, categoryId, orgId, lowStockOnly)
            );

            List<Map<String, Object>> dtoList = new ArrayList<>();
            for (Product p : products) {
                dtoList.add(buildProductDto(p));
            }

            resp.put("success", true);
            resp.put("products", dtoList);
            resp.put("data", dtoList);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @GetMapping("/alerts")
    public ResponseEntity<Map<String, Object>> getLowStockAlerts() {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            long count;
            if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole()) && currentUser.getOrganization() != null) {
                count = productRepository.countLowStockProductsByOrg(currentUser.getOrganization().getId());
            } else {
                count = productRepository.countLowStockProducts();
            }
            resp.put("success", true);
            resp.put("count", count);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("count", 0);
            return ResponseEntity.ok(resp);
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategories() {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            List<Category> categories;
            if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole()) && currentUser.getOrganization() != null) {
                categories = categoryRepository.findByOrganizationIdAndIsActiveTrueOrderByNameAsc(currentUser.getOrganization().getId());
            } else {
                categories = categoryRepository.findByIsActiveTrueOrderByNameAsc();
            }

            List<Map<String, Object>> dtoList = new ArrayList<>();
            for (Category c : categories) {
                Map<String, Object> cMap = new HashMap<>();
                cMap.put("id", c.getId().toString());
                cMap.put("name", c.getName());
                cMap.put("name_mm", c.getNameMm());
                cMap.put("image_url", c.getImageUrl());
                cMap.put("is_active", c.getIsActive());
                dtoList.add(cMap);
            }

            resp.put("success", true);
            resp.put("categories", dtoList);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @PostMapping("/categories")
    public ResponseEntity<Map<String, Object>> createCategory(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            String name = (String) body.get("name");
            String nameMm = (String) body.get("name_mm");

            if (name == null || name.isBlank()) {
                resp.put("success", false);
                resp.put("message", "Category name is required.");
                return ResponseEntity.badRequest().body(resp);
            }

            Category cat = new Category();
            cat.setName(name.trim());
            cat.setNameMm(nameMm != null ? nameMm.trim() : null);
            if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
                cat.setOrganization(currentUser.getOrganization());
            }

            Category saved = categoryRepository.save(cat);
            resp.put("success", true);
            resp.put("category", saved);
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Map<String, Object>> createProduct(@RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User currentUser = securityHelper.getCurrentUser().orElse(null);
            String name = (String) body.get("name");
            String nameMm = (String) body.get("name_mm");
            String sku = (String) body.get("sku");
            String barcode = (String) body.get("barcode");
            String categoryId = (String) body.get("category_id");
            Object costPriceObj = body.get("cost_price");
            Object salePriceObj = body.get("sale_price");
            if (salePriceObj == null) salePriceObj = body.get("selling_price");
            String imageUrl = (String) body.get("image_url");
            String description = (String) body.get("description");
            Object thresholdObj = body.get("low_stock_threshold");
            Object stockObj = body.get("stock_quantity");

            if (name == null || salePriceObj == null) {
                resp.put("success", false);
                resp.put("message", "Product name and selling price are required.");
                return ResponseEntity.badRequest().body(resp);
            }

            Product product = new Product();
            product.setName(name.trim());
            product.setNameMm(nameMm != null ? nameMm.trim() : null);
            product.setSku(sku != null ? sku.trim() : "SKU-" + System.currentTimeMillis());
            product.setBarcode(barcode != null ? barcode.trim() : null);
            product.setDescription(description);
            product.setCostPrice(costPriceObj != null ? new BigDecimal(costPriceObj.toString()) : BigDecimal.ZERO);
            product.setSellingPrice(new BigDecimal(salePriceObj.toString()));
            product.setLowStockThreshold(thresholdObj != null ? Integer.parseInt(thresholdObj.toString()) : 5);
            product.setStockQuantity(stockObj != null ? Integer.parseInt(stockObj.toString()) : 0);
            product.setImageUrl(imageUrl);
            product.setIsActive(true);

            // Tenant scoping
            if (currentUser != null && !"SYSADMIN".equalsIgnoreCase(currentUser.getRole())) {
                product.setOrganization(currentUser.getOrganization());
            }

            // Category
            if (categoryId != null && !categoryId.isBlank()) {
                try {
                    categoryRepository.findById(UUID.fromString(categoryId)).ifPresent(product::setCategory);
                } catch (Exception ignored) {}
            }

            // Image ID mapping
            if (imageUrl != null && imageUrl.startsWith("/api/images/")) {
                try {
                    UUID imgId = UUID.fromString(imageUrl.substring("/api/images/".length()));
                    imageRepository.findById(imgId).ifPresent(product::setImage);
                } catch (Exception ignored) {}
            }

            // Variants
            if (body.containsKey("variants") && body.get("variants") instanceof List<?> vList) {
                for (Object item : vList) {
                    if (item instanceof Map<?, ?> vMap) {
                        String vName = (String) vMap.get("variant_name");
                        Object vQty = vMap.get("stock_quantity");
                        Object vPriceAdj = vMap.get("price_adjustment");

                        ProductVariant variant = new ProductVariant();
                        variant.setProduct(product);
                        variant.setVariantName(vName != null ? vName : "Standard");
                        variant.setStockQuantity(vQty != null ? Integer.parseInt(vQty.toString()) : 0);
                        variant.setPriceAdjustment(vPriceAdj != null ? new BigDecimal(vPriceAdj.toString()) : BigDecimal.ZERO);
                        product.getVariants().add(variant);
                    }
                }
            }

            Product saved = productRepository.save(product);
            resp.put("success", true);
            resp.put("message", "Product created successfully");
            resp.put("product", buildProductDto(saved));
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> updateProduct(@PathVariable("id") String idStr, @RequestBody Map<String, Object> body) {
        Map<String, Object> resp = new HashMap<>();
        try {
            UUID id = UUID.fromString(idStr);
            Product p = productRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));

            if (body.containsKey("name") && body.get("name") != null) p.setName(((String) body.get("name")).trim());
            if (body.containsKey("name_mm")) p.setNameMm((String) body.get("name_mm"));
            if (body.containsKey("sku")) p.setSku((String) body.get("sku"));
            if (body.containsKey("barcode")) p.setBarcode((String) body.get("barcode"));
            if (body.containsKey("description")) p.setDescription((String) body.get("description"));
            if (body.containsKey("cost_price")) p.setCostPrice(new BigDecimal(body.get("cost_price").toString()));
            if (body.containsKey("sale_price")) p.setSellingPrice(new BigDecimal(body.get("sale_price").toString()));
            if (body.containsKey("selling_price")) p.setSellingPrice(new BigDecimal(body.get("selling_price").toString()));
            if (body.containsKey("stock_quantity")) p.setStockQuantity(Integer.parseInt(body.get("stock_quantity").toString()));
            if (body.containsKey("low_stock_threshold")) p.setLowStockThreshold(Integer.parseInt(body.get("low_stock_threshold").toString()));

            if (body.containsKey("category_id")) {
                String catId = (String) body.get("category_id");
                if (catId != null && !catId.isBlank()) {
                    categoryRepository.findById(UUID.fromString(catId)).ifPresent(p::setCategory);
                } else {
                    p.setCategory(null);
                }
            }

            if (body.containsKey("image_url")) {
                String imgUrl = (String) body.get("image_url");
                p.setImageUrl(imgUrl);
                if (imgUrl != null && imgUrl.startsWith("/api/images/")) {
                    try {
                        UUID imgId = UUID.fromString(imgUrl.substring("/api/images/".length()));
                        imageRepository.findById(imgId).ifPresent(p::setImage);
                    } catch (Exception ignored) {}
                }
            }

            p.setUpdatedAt(OffsetDateTime.now());
            Product saved = productRepository.save(p);
            resp.put("success", true);
            resp.put("message", "Product updated successfully");
            resp.put("product", buildProductDto(saved));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable("id") String idStr) {
        Map<String, Object> resp = new HashMap<>();
        try {
            UUID id = UUID.fromString(idStr);
            Product p = productRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found"));

            p.setIsActive(false);
            productRepository.save(p);

            resp.put("success", true);
            resp.put("message", "Product deleted successfully");
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resp);
        }
    }

    private Map<String, Object> buildProductDto(Product p) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", p.getId().toString());
        dto.put("name", p.getName());
        dto.put("name_mm", p.getNameMm());
        dto.put("sku", p.getSku());
        dto.put("barcode", p.getBarcode());
        dto.put("description", p.getDescription());
        dto.put("cost_price", p.getCostPrice());
        dto.put("sale_price", p.getSellingPrice());
        dto.put("selling_price", p.getSellingPrice());
        dto.put("stock_quantity", p.getStockQuantity());
        dto.put("low_stock_threshold", p.getLowStockThreshold());
        dto.put("unit", p.getUnit());
        dto.put("image_url", p.getImageUrl());
        dto.put("is_active", p.getIsActive());

        if (p.getCategory() != null) {
            dto.put("category_id", p.getCategory().getId().toString());
            dto.put("category_name", p.getCategory().getName());
            dto.put("category_name_mm", p.getCategory().getNameMm());
        }

        List<Map<String, Object>> vList = new ArrayList<>();
        if (p.getVariants() != null) {
            for (ProductVariant v : p.getVariants()) {
                Map<String, Object> vMap = new HashMap<>();
                vMap.put("id", v.getId().toString());
                vMap.put("variant_name", v.getVariantName());
                vMap.put("sku", v.getSku());
                vMap.put("price_adjustment", v.getPriceAdjustment());
                vMap.put("stock_quantity", v.getStockQuantity());
                vList.add(vMap);
            }
        }
        dto.put("variants", vList);
        return dto;
    }
}
