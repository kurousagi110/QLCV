import labelDAO from "../models/labelDAO.js";

export default class LabelController {
    static async createLabel(req, res) {
        const { projectId } = req.params;
        const { name, color } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "Label name is required" });
        }

        try {
            const labelId = await labelDAO.addLabel(projectId, name, color);
            res.status(201).json({ 
                message: "Label created successfully", 
                labelId 
            });
        } catch (e) {
            console.error("Create label error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async getLabels(req, res) {
        const { projectId } = req.params;
        
        try {
            const labels = await labelDAO.getLabels(projectId);
            res.status(200).json({
                count: labels.length,
                labels
            });
        } catch (e) {
            console.error("Get labels error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async updateLabel(req, res) {
        const { projectId, labelId } = req.params;
        const { name, color } = req.body;
        
        if (!name && !color) {
            return res.status(400).json({ error: "At least one field (name or color) is required for update" });
        }

        try {
            const updated = await labelDAO.updateLabel(projectId, labelId, name, color);
            
            if (!updated) {
                return res.status(404).json({ error: "Label not found or no changes made" });
            }
            
            res.status(200).json({ message: "Label updated successfully" });
        } catch (e) {
            console.error("Update label error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async deleteLabel(req, res) {
        const { projectId, labelId } = req.params;
        
        try {
            const deleted = await labelDAO.deleteLabel(projectId, labelId);
            
            if (!deleted) {
                return res.status(404).json({ error: "Label not found" });
            }
            
            res.status(200).json({ message: "Label deleted successfully" });
        } catch (e) {
            console.error("Delete label error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async getLabelById(req, res) {
        const { projectId, labelId } = req.params;
        
        try {
            const label = await labelDAO.getLabelById(projectId, labelId);
            
            if (!label) {
                return res.status(404).json({ error: "Label not found" });
            }
            
            res.status(200).json(label);
        } catch (e) {
            console.error("Get label by ID error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async getLabelsByUserId(req, res) {
        const { userId } = req.params;
        
        try {
            const labels = await labelDAO.getLabelsByUserId(userId);
            res.status(200).json({
                count: labels.length,
                labels
            });
        } catch (e) {
            console.error("Get labels by user ID error:", e);
            res.status(500).json({ error: e.message });
        }
    }

    static async searchLabels(req, res) {
        const { userId } = req.params;
        const { query, page = 1, limit = 10 } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        try {
            const result = await labelDAO.searchLabels(userId, query, parseInt(page), parseInt(limit));
            res.status(200).json(result);
        } catch (e) {
            console.error("Search labels error:", e);
            res.status(500).json({ error: e.message });
        }
    }
}