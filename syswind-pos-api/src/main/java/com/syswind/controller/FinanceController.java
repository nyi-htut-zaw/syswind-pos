package com.syswind.controller;

import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/accounts")
    public ResponseEntity<Map<String, Object>> getAccounts() {
        Map<String, Object> resp = new HashMap<>();
        List<Map<String, Object>> list = jdbcTemplate.queryForList(
                "SELECT * FROM financial_accounts WHERE is_active = true ORDER BY account_code ASC"
        );
        resp.put("success", true);
        resp.put("accounts", list);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/transactions")
    public ResponseEntity<Map<String, Object>> getTransactions(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "50") int limit
    ) {
        Map<String, Object> resp = new HashMap<>();
        List<Map<String, Object>> list = jdbcTemplate.queryForList(
                """
                SELECT t.*, 
                       sa.account_name as source_account_name,
                       da.account_name as destination_account_name,
                       u.full_name as created_by_name
                FROM transactions t
                LEFT JOIN financial_accounts sa ON sa.id = t.source_account_id
                LEFT JOIN financial_accounts da ON da.id = t.destination_account_id
                LEFT JOIN users u ON u.id = t.created_by
                ORDER BY t.transaction_date DESC
                LIMIT ? OFFSET ?
                """,
                limit, (page - 1) * limit
        );

        resp.put("success", true);
        resp.put("transactions", list);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/transactions")
    public ResponseEntity<Map<String, Object>> recordTransaction(@RequestBody Map<String, Object> body, Authentication auth) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String type = (String) body.get("transaction_type");
            String destAccId = (String) body.get("destination_account_id");
            String srcAccId = (String) body.get("source_account_id");
            double amount = Double.parseDouble(body.get("amount").toString());
            String category = (String) body.get("category");
            String description = (String) body.get("description");

            String userId = null;
            if (auth != null && auth.getPrincipal() instanceof Claims claims) {
                userId = claims.getSubject();
            }

            String txnNumber = "TXN-" + System.currentTimeMillis();

            UUID dUuid = (destAccId != null && !destAccId.isBlank()) ? UUID.fromString(destAccId) : null;
            UUID sUuid = (srcAccId != null && !srcAccId.isBlank()) ? UUID.fromString(srcAccId) : null;

            Map<String, Object> txn = jdbcTemplate.queryForMap(
                    """
                    INSERT INTO transactions (transaction_number, transaction_type, source_account_id, destination_account_id, amount, category, description, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?::uuid)
                    RETURNING *
                    """,
                    txnNumber, type, sUuid, dUuid, amount, category, description,
                    userId != null ? UUID.fromString(userId) : null
            );

            if (dUuid != null) {
                jdbcTemplate.update("UPDATE financial_accounts SET current_balance = current_balance + ? WHERE id = ?", amount, dUuid);
            }
            if (sUuid != null) {
                jdbcTemplate.update("UPDATE financial_accounts SET current_balance = current_balance - ? WHERE id = ?", amount, sUuid);
            }

            resp.put("success", true);
            resp.put("message", "Transaction recorded successfully");
            resp.put("transaction", txn);
            return ResponseEntity.status(201).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    @GetMapping("/expenses")
    public ResponseEntity<Map<String, Object>> getExpenses(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "50") int limit
    ) {
        Map<String, Object> resp = new HashMap<>();
        List<Map<String, Object>> list = jdbcTemplate.queryForList(
                """
                SELECT e.*, a.account_name, u.full_name as created_by_name
                FROM expenses e
                LEFT JOIN financial_accounts a ON a.id = e.account_id
                LEFT JOIN users u ON u.id = e.created_by
                ORDER BY e.expense_date DESC, e.created_at DESC
                LIMIT ? OFFSET ?
                """,
                limit, (page - 1) * limit
        );

        resp.put("success", true);
        resp.put("expenses", list);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/expenses")
    public ResponseEntity<Map<String, Object>> createExpense(@RequestBody Map<String, Object> body, Authentication auth) {
        Map<String, Object> resp = new HashMap<>();
        try {
            String title = (String) body.get("title");
            String category = (String) body.get("category");
            double amount = Double.parseDouble(body.get("amount").toString());
            String paymentMethod = (String) body.get("payment_method");
            String accountId = (String) body.get("account_id");
            String paidTo = (String) body.get("paid_to");
            String notes = (String) body.get("notes");
            String receiptUrl = (String) body.get("receipt_image_url");

            String userId = null;
            if (auth != null && auth.getPrincipal() instanceof Claims claims) {
                userId = claims.getSubject();
            }

            UUID aUuid = (accountId != null && !accountId.isBlank()) ? UUID.fromString(accountId) : null;

            Map<String, Object> exp = jdbcTemplate.queryForMap(
                    """
                    INSERT INTO expenses (title, category, amount, payment_method, account_id, paid_to, receipt_image_url, notes, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::uuid)
                    RETURNING *
                    """,
                    title, category, amount, paymentMethod != null ? paymentMethod : "CASH",
                    aUuid, paidTo, receiptUrl, notes, userId != null ? UUID.fromString(userId) : null
            );

            if (aUuid != null) {
                jdbcTemplate.update("UPDATE financial_accounts SET current_balance = current_balance - ? WHERE id = ?", amount, aUuid);
            }

            resp.put("success", true);
            resp.put("message", "Expense recorded successfully");
            resp.put("expense", exp);
            return ResponseEntity.status(201).body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        Map<String, Object> resp = new HashMap<>();
        try {
            Double totalBalance = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(current_balance), 0) FROM financial_accounts WHERE is_active = true",
                    Double.class
            );

            Double totalRevenue = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'PAID'",
                    Double.class
            );

            Double totalExpenses = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(amount), 0) FROM expenses",
                    Double.class
            );

            resp.put("success", true);
            resp.put("total_balance", totalBalance);
            resp.put("total_revenue", totalRevenue);
            resp.put("total_expenses", totalExpenses);
            resp.put("net_profit", (totalRevenue != null ? totalRevenue : 0) - (totalExpenses != null ? totalExpenses : 0));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }
}
