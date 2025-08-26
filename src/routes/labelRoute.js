import express from "express";
import LabelController from "../controllers/labelController.js";
import middleware from "../middleware.js";

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực
router.use(middleware.authenticateToken);

// Validation middleware cho label
const validateLabel = (req, res, next) => {
    const { name, color } = req.body;
    
    if (name && name.length > 30) {
        return res.status(400).json({ error: "Label name must be less than 30 characters" });
    }
    
    if (color && !/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
        return res.status(400).json({ error: "Color must be a valid hex code" });
    }
    
    next();
};

// Routes
router.post("/projects/:projectId/labels", validateLabel, LabelController.createLabel);
router.get("/projects/:projectId/labels", LabelController.getLabels);
router.get("/projects/:projectId/labels/:labelId", LabelController.getLabelById);
router.put("/projects/:projectId/labels/:labelId", validateLabel, LabelController.updateLabel);
router.delete("/projects/:projectId/labels/:labelId", LabelController.deleteLabel);
router.get("/users/:userId/labels", LabelController.getLabelsByUserId);
router.get("/users/:userId/labels/search", LabelController.searchLabels);

export default router;