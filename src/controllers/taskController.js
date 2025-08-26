import taskDAO from "../models/taskDAO.js";

export default class TaskController {
    static async createTask(req, res) {
        const { projectId, sectionId } = req.params;
        const { name, description, assigneeId, dueDate, priority, labels } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "Task name is required" });
        }

        try {
            const taskId = await taskDAO.addTask(projectId, sectionId, name, description, assigneeId, dueDate, priority, labels);
            res.status(201).json({ 
                message: "Task created successfully", 
                taskId 
            });
        } catch (e) {
            console.error("Create task error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async getTasks(req, res) {
        const { projectId, sectionId } = req.params;
        
        try {
            const tasks = await taskDAO.getTasks(projectId, sectionId);
            res.status(200).json({
                count: tasks.length,
                tasks
            });
        } catch (e) {
            console.error("Get tasks error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async updateTask(req, res) {
        const { projectId, sectionId, taskId } = req.params;
        const updateData = req.body;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "At least one field is required for update" });
        }

        try {
            const updated = await taskDAO.updateTask(projectId, sectionId, taskId, updateData);
            
            if (!updated) {
                return res.status(404).json({ error: "Task not found or no changes made" });
            }
            
            res.status(200).json({ message: "Task updated successfully" });
        } catch (e) {
            console.error("Update task error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async deleteTask(req, res) {
        const { projectId, sectionId, taskId } = req.params;
        
        try {
            const deleted = await taskDAO.deleteTask(projectId, sectionId, taskId);
            
            if (!deleted) {
                return res.status(404).json({ error: "Task not found" });
            }
            
            res.status(200).json({ message: "Task deleted successfully" });
        } catch (e) {
            console.error("Delete task error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async getTaskById(req, res) {
        const { projectId, sectionId, taskId } = req.params;
        
        try {
            const task = await taskDAO.getTaskById(projectId, sectionId, taskId);
            
            if (!task) {
                return res.status(404).json({ error: "Task not found" });
            }
            
            res.status(200).json(task);
        } catch (e) {
            console.error("Get task by ID error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async getTasksByUserId(req, res) {
        const { userId } = req.params;
        
        try {
            const tasks = await taskDAO.getTasksByUserId(userId);
            res.status(200).json({
                count: tasks.length,
                tasks
            });
        } catch (e) {
            console.error("Get tasks by user ID error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async getTasksByProjectId(req, res) {
        const { projectId } = req.params;
        
        try {
            const tasks = await taskDAO.getTasksByProjectId(projectId);
            res.status(200).json({
                count: tasks.length,
                tasks
            });
        } catch (e) {
            console.error("Get tasks by project ID error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async searchTasks(req, res) {
        const { userId } = req.params;
        const { query, status, priority, assigneeId, page = 1, limit = 10 } = req.query;
        
        try {
            const filters = {};
            if (status) filters.status = status;
            if (priority) filters.priority = priority;
            if (assigneeId) filters.assigneeId = assigneeId;
            
            const result = await taskDAO.searchTasks(userId, query, filters, parseInt(page), parseInt(limit));
            res.status(200).json(result);
        } catch (e) {
            console.error("Search tasks error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async updateTaskStatus(req, res) {
        const { projectId, sectionId, taskId } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }

        const validStatuses = ["todo", "inprogress", "review", "done"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        try {
            const updated = await taskDAO.updateTaskStatus(projectId, sectionId, taskId, status);
            
            if (!updated) {
                return res.status(404).json({ error: "Task not found" });
            }
            
            res.status(200).json({ message: "Task status updated successfully" });
        } catch (e) {
            console.error("Update task status error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async addLabelToTask(req, res) {
        const { projectId, sectionId, taskId } = req.params;
        const { labelId } = req.body;
        
        if (!labelId) {
            return res.status(400).json({ error: "Label ID is required" });
        }

        try {
            const updated = await taskDAO.addLabelToTask(projectId, sectionId, taskId, labelId);
            
            if (!updated) {
                return res.status(404).json({ error: "Task or label not found" });
            }
            
            res.status(200).json({ message: "Label added to task successfully" });
        } catch (e) {
            console.error("Add label to task error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async removeLabelFromTask(req, res) {
        const { projectId, sectionId, taskId } = req.params;
        const { labelId } = req.body;
        
        if (!labelId) {
            return res.status(400).json({ error: "Label ID is required" });
        }

        try {
            const updated = await taskDAO.removeLabelFromTask(projectId, sectionId, taskId, labelId);
            
            if (!updated) {
                return res.status(404).json({ error: "Task or label not found" });
            }
            
            res.status(200).json({ message: "Label removed from task successfully" });
        } catch (e) {
            console.error("Remove label from task error:", e);
            res.status(500).json({ error: e.message });
        }
    }
}