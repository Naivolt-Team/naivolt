const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const {
  getAllTransactions,
  getTransactionById,
  approveTransaction,
  rejectTransaction,
  getAdminStats,
  getAllUsers,
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(protect, adminMiddleware);

router.get("/transactions", getAllTransactions);
router.get("/transactions/:id", getTransactionById);
router.patch("/transactions/:id/approve", approveTransaction);
router.patch("/transactions/:id/reject", rejectTransaction);
router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);

module.exports = router;
