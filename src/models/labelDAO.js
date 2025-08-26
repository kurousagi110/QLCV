import mongodb from "mongodb"
const ObjectId = mongodb.ObjectId

let projects // Sử dụng collection projects thay vì labels
export default class labelDAO {
    static async injectDB(conn) {
        if (projects) {
            return
        }
        try {
            projects = await conn.db(process.env.MOVIEREVIEWS_DB_NAME).collection("projects")
        } catch (e) {
            console.error(`Unable to establish a collection handle in labelDAO: ${e}`)
        }
    }

    static async addLabel(projectId, name, color = "#3498db") {
        try {
            const labelDoc = {
                _id: new ObjectId(), // Tạo ID mới cho label
                name: name,
                color: color,
                createdAt: new Date()
            }
            
            const result = await projects.updateOne(
                { _id: projectId },
                { 
                    $push: { labels: labelDoc },
                    $set: { updatedAt: new Date() }
                }
            )
            
            return result.modifiedCount > 0 ? labelDoc._id : null
        } catch (e) {
            console.error(`Unable to add label: ${e}`)
            throw e
        }
    }

    static async getLabels(projectId) {
        try {
            const project = await projects.findOne(
                { _id: projectId },
                { projection: { labels: 1 } }
            )
            
            return project ? project.labels || [] : []
        } catch (e) {
            console.error(`Unable to get labels: ${e}`)
            throw e
        }
    }

    static async updateLabel(projectId, labelId, name, color) {
        try {
            const updateFields = { updatedAt: new Date() };
            
            if (name) updateFields["labels.$.name"] = name;
            if (color) updateFields["labels.$.color"] = color;
            
            const result = await projects.updateOne(
                { 
                    _id: projectId,
                    "labels._id": labelId
                },
                { $set: updateFields }
            )
            
            return result.modifiedCount > 0
        } catch (e) {
            console.error(`Unable to update label: ${e}`)
            throw e
        }
    }

    static async deleteLabel(projectId, labelId) {
        try {
            const result = await projects.updateOne(
                { _id: projectId },
                { 
                    $pull: { labels: { _id: labelId } },
                    $set: { updatedAt: new Date() }
                }
            )
            
            return result.modifiedCount > 0
        } catch (e) {
            console.error(`Unable to delete label: ${e}`)
            throw e
        }
    }

    static async getLabelById(projectId, labelId) {
        try {
            const project = await projects.findOne(
                { 
                    _id: projectId,
                    "labels._id": labelId
                },
                { projection: { "labels.$": 1 } }
            )
            
            return project && project.labels ? project.labels[0] : null
        } catch (e) {
            console.error(`Unable to get label by ID: ${e}`)
            throw e
        }
    }

    static async getLabelsByUserId(userId) {
        try {
            // Lấy tất cả projects của user, sau đó extract labels từ mỗi project
            const userProjects = await projects.find(
                { userId: userId },
                { projection: { labels: 1 } }
            ).toArray()
            
            // Gom tất cả labels từ các projects lại
            const allLabels = userProjects.reduce((acc, project) => {
                if (project.labels && project.labels.length > 0) {
                    // Thêm projectId vào mỗi label để biết label thuộc project nào
                    const labelsWithProject = project.labels.map(label => ({
                        ...label,
                        projectId: project._id
                    }));
                    return acc.concat(labelsWithProject);
                }
                return acc;
            }, []);
            
            return allLabels
        } catch (e) {
            console.error(`Unable to get labels by user ID: ${e}`)
            throw e
        }
    }

    static async searchLabels(userId, query, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            
            // Tìm projects của user có labels phù hợp với query
            const projectsWithMatchingLabels = await projects.find({
                userId: userId,
                "labels.name": { $regex: query, $options: 'i' }
            }).toArray()
            
            // Extract và filter labels từ các projects
            const matchingLabels = projectsWithMatchingLabels.reduce((acc, project) => {
                if (project.labels && project.labels.length > 0) {
                    const filteredLabels = project.labels.filter(label => 
                        label.name.toLowerCase().includes(query.toLowerCase())
                    ).map(label => ({
                        ...label,
                        projectId: project._id
                    }));
                    return acc.concat(filteredLabels);
                }
                return acc;
            }, []);
            
            // Phân trang
            const paginatedLabels = matchingLabels.slice(skip, skip + limit);
            
            return {
                labels: paginatedLabels,
                total: matchingLabels.length,
                page: page,
                limit: limit,
                pages: Math.ceil(matchingLabels.length / limit)
            }
        } catch (e) {
            console.error(`Unable to search labels: ${e}`)
            throw e
        }
    }

    static async countLabels(projectId) {
        try {
            const project = await projects.findOne(
                { _id: projectId },
                { projection: { labels: 1 } }
            )
            
            return project && project.labels ? project.labels.length : 0
        } catch (e) {
            console.error(`Unable to count labels: ${e}`)
            throw e
        }
    }

    static async getProjectsByLabelName(userId, labelName) {
        try {
            const projectsList = await projects.find({
                userId: userId,
                "labels.name": { $regex: labelName, $options: 'i' }
            }).toArray()
            
            return projectsList
        } catch (e) {
            console.error(`Unable to get projects by label name: ${e}`)
            throw e
        }
    }
}