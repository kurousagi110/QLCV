import express from "express";
import TaskController from "../controllers/taskController.js";
import middleware from "../middleware.js";

const router = express.Router();

// Tất cả routes đều yêu cầu xác thực
router.use(middleware.authenticateToken);

// Validation middleware cho task
const validateTask = (req, res, next) => {
    const { name, description, priority, status } = req.body;
    
    if (name && name.length > 100) {
        return res.status(400).json({ error: "Task name must be less than 100 characters" });
    }
    
    if (description && description.length > 500) {
        return res.status(400).json({ error: "Description must be less than 500 characters" });
    }
    
    if (priority && !["low", "medium", "high", "urgent"].includes(priority)) {
        return res.status(400).json({ error: "Priority must be one of: low, medium, high, urgent" });
    }
    
    if (status && !["todo", "inprogress", "review", "done"].includes(status)) {
        return res.status(400).json({ error: "Status must be one of: todo, inprogress, review, done" });
    }
    
    next();
};

// Routes
router.post("/projects/:projectId/sections/:sectionId/tasks", validateTask, TaskController.createTask);
router.get("/projects/:projectId/sections/:sectionId/tasks", TaskController.getTasks);
router.get("/projects/:projectId/sections/:sectionId/tasks/:taskId", TaskController.getTaskById);
router.put("/projects/:projectId/sections/:sectionId/tasks/:taskId", validateTask, TaskController.updateTask);
router.delete("/projects/:projectId/sections/:sectionId/tasks/:taskId", TaskController.deleteTask);
router.get("/users/:userId/tasks", TaskController.getTasksByUserId);
router.get("/projects/:projectId/tasks", TaskController.getTasksByProjectId);
router.get("/users/:userId/tasks/search", TaskController.searchTasks);
router.patch("/projects/:projectId/sections/:sectionId/tasks/:taskId/status", TaskController.updateTaskStatus);
router.post("/projects/:projectId/sections/:sectionId/tasks/:taskId/labels", TaskController.addLabelToTask);
router.delete("/projects/:projectId/sections/:sectionId/tasks/:taskId/labels", TaskController.removeLabelFromTask);

export default router;