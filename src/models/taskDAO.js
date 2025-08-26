import mongodb from "mongodb"
const ObjectId = mongodb.ObjectId

let projects // Sử dụng collection projects
export default class taskDAO {
    static async injectDB(conn) {
        if (projects) {
            return
        }
        try {
            projects = await conn.db(process.env.MOVIEREVIEWS_DB_NAME).collection("projects")
        } catch (e) {
            console.error(`Unable to establish a collection handle in taskDAO: ${e}`)
        }
    }

    static async addTask(projectId, sectionId, name, description, assigneeId, dueDate, priority = "medium", labels = []) {
        try {
            const taskDoc = {
                _id: new ObjectId(), // Tạo ID mới cho task
                name: name,
                description: description,
                assigneeId: assigneeId ? assigneeId : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                priority: priority,
                labels: labels,
                status: "todo",
                createdAt: new Date(),
                updatedAt: new Date()
            }
            
            // Tìm section trong project và thêm task
            const result = await projects.updateOne(
                { 
                    _id: projectId,
                    "sections._id": sectionId
                },
                { 
                    $push: { "sections.$.tasks": taskDoc },
                    $set: { updatedAt: new Date() }
                }
            )
            
            return result.modifiedCount > 0 ? taskDoc._id : null
        } catch (e) {
            console.error(`Unable to add task: ${e}`)
            throw e
        }
    }

    static async getTasks(projectId, sectionId) {
        try {
            const project = await projects.findOne(
                { 
                    _id: projectId,
                    "sections._id": sectionId
                },
                { projection: { "sections.$": 1 } }
            )
            
            return project && project.sections && project.sections[0].tasks 
                ? project.sections[0].tasks 
                : []
        } catch (e) {
            console.error(`Unable to get tasks: ${e}`)
            throw e
        }
    }

    static async updateTask(projectId, sectionId, taskId, updateData) {
        try {
            const updateFields = { updatedAt: new Date() };
            
            // Tạo dynamic update fields
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    updateFields[`sections.$[section].tasks.$[task].${key}`] = updateData[key];
                }
            });
            
            const result = await projects.updateOne(
                { _id: projectId },
                { $set: updateFields },
                {
                    arrayFilters: [
                        { "section._id": sectionId },
                        { "task._id": taskId }
                    ]
                }
            )
            
            return result.modifiedCount > 0
        } catch (e) {
            console.error(`Unable to update task: ${e}`)
            throw e
        }
    }

    static async deleteTask(projectId, sectionId, taskId) {
        try {
            const result = await projects.updateOne(
                { _id: projectId },
                { 
                    $pull: { 
                        "sections.$[section].tasks": { _id: taskId } 
                    },
                    $set: { updatedAt: new Date() }
                },
                {
                    arrayFilters: [
                        { "section._id": sectionId }
                    ]
                }
            )
            
            return result.modifiedCount > 0
        } catch (e) {
            console.error(`Unable to delete task: ${e}`)
            throw e
        }
    }

    static async getTaskById(projectId, sectionId, taskId) {
        try {
            const project = await projects.findOne(
                { 
                    _id: projectId,
                    "sections._id": sectionId,
                    "sections.tasks._id": taskId
                },
                { 
                    projection: { 
                        "sections": { 
                            "$elemMatch": { "_id": sectionId } 
                        } 
                    } 
                }
            )
            
            if (!project || !project.sections || project.sections.length === 0) {
                return null;
            }
            
            const section = project.sections[0];
            const task = section.tasks.find(t => t._id.toString() === taskId);
            
            return task || null;
        } catch (e) {
            console.error(`Unable to get task by ID: ${e}`)
            throw e
        }
    }

    static async getTasksByUserId(userId) {
        try {
            // Tìm tất cả tasks mà user được assign
            const userProjects = await projects.find({
                "sections.tasks.assigneeId": userId
            }).toArray()
            
            // Gom tất cả tasks của user
            const userTasks = userProjects.reduce((acc, project) => {
                project.sections.forEach(section => {
                    if (section.tasks && section.tasks.length > 0) {
                        const userTasksInSection = section.tasks.filter(task => 
                            task.assigneeId && task.assigneeId.toString() === userId
                        ).map(task => ({
                            ...task,
                            projectId: project._id,
                            projectName: project.name,
                            sectionId: section._id,
                            sectionName: section.name
                        }));
                        acc = acc.concat(userTasksInSection);
                    }
                });
                return acc;
            }, []);
            
            return userTasks
        } catch (e) {
            console.error(`Unable to get tasks by user ID: ${e}`)
            throw e
        }
    }

    static async getTasksByProjectId(projectId) {
        try {
            const project = await projects.findOne(
                { _id: projectId },
                { projection: { sections: 1, name: 1 } }
            )
            
            if (!project) {
                return [];
            }
            
            // Gom tất cả tasks từ tất cả sections
            const allTasks = project.sections.reduce((acc, section) => {
                if (section.tasks && section.tasks.length > 0) {
                    const tasksWithSection = section.tasks.map(task => ({
                        ...task,
                        sectionId: section._id,
                        sectionName: section.name,
                        projectId: project._id,
                        projectName: project.name
                    }));
                    return acc.concat(tasksWithSection);
                }
                return acc;
            }, []);
            
            return allTasks
        } catch (e) {
            console.error(`Unable to get tasks by project ID: ${e}`)
            throw e
        }
    }

    static async searchTasks(userId, query, filters = {}, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            
            // Build filter query
            let filterQuery = {
                "sections.tasks.name": { $regex: query, $options: 'i' }
            };
            
            // Thêm filters nếu có
            if (filters.status) {
                filterQuery["sections.tasks.status"] = filters.status;
            }
            if (filters.priority) {
                filterQuery["sections.tasks.priority"] = filters.priority;
            }
            if (filters.assigneeId) {
                filterQuery["sections.tasks.assigneeId"] = filters.assigneeId;
            }
            
            // Nếu không phải admin, chỉ tìm tasks của user
            if (userId) {
                filterQuery["$or"] = [
                    { userId: userId }, // Projects của user
                    { "sections.tasks.assigneeId": userId } // Tasks assigned to user
                ];
            }
            
            const projectsWithTasks = await projects.find(filterQuery).toArray();
            
            // Extract và filter tasks
            const matchingTasks = projectsWithTasks.reduce((acc, project) => {
                project.sections.forEach(section => {
                    if (section.tasks && section.tasks.length > 0) {
                        const filteredTasks = section.tasks.filter(task => 
                            task.name.toLowerCase().includes(query.toLowerCase()) &&
                            (!filters.status || task.status === filters.status) &&
                            (!filters.priority || task.priority === filters.priority) &&
                            (!filters.assigneeId || (task.assigneeId && task.assigneeId.toString() === filters.assigneeId))
                        ).map(task => ({
                            ...task,
                            sectionId: section._id,
                            sectionName: section.name,
                            projectId: project._id,
                            projectName: project.name
                        }));
                        acc = acc.concat(filteredTasks);
                    }
                });
                return acc;
            }, []);
            
            // Phân trang
            const paginatedTasks = matchingTasks.slice(skip, skip + limit);
            
            return {
                tasks: paginatedTasks,
                total: matchingTasks.length,
                page: page,
                limit: limit,
                pages: Math.ceil(matchingTasks.length / limit)
            }
        } catch (e) {
            console.error(`Unable to search tasks: ${e}`)
            throw e
        }
    }

    static async updateTaskStatus(projectId, sectionId, taskId, status) {
        try {
            const result = await projects.updateOne(
                { _id: projectId },
                { 
                    $set: { 
                        "sections.$[section].tasks.$[task].status": status,
                        "sections.$[section].tasks.$[task].updatedAt": new Date(),
                        updatedAt: new Date()
                    } 
                },
                {
                    arrayFilters: [
                        { "section._id": sectionId },
                        { "task._id": taskId }
                    ]
                }
            )
            
            return result.modifiedCount > 0
        } catch (e) {
            console.error(`Unable to update task status: ${e}`)
            throw e
        }
    }

    static async addLabelToTask(projectId, sectionId, taskId, labelId) {
        try {
            const result = await projects.updateOne(
                { _id: projectId },
                { 
                    $addToSet: { 
                        "sections.$[section].tasks.$[task].labels": labelId 
                    },
                    $set: { 
                        "sections.$[section].tasks.$[task].updatedAt": new Date(),
                        updatedAt: new Date()
                    } 
                },
                {
                    arrayFilters: [
                        { "section._id": sectionId },
                        { "task._id": taskId }
                    ]
                }
            )
            
            return result.modifiedCount > 0
        } catch (e) {
            console.error(`Unable to add label to task: ${e}`)
            throw e
        }
    }

    static async removeLabelFromTask(projectId, sectionId, taskId, labelId) {
        try {
            const result = await projects.updateOne(
                { _id: projectId },
                { 
                    $pull: { 
                        "sections.$[section].tasks.$[task].labels": labelId 
                    },
                    $set: { 
                        "sections.$[section].tasks.$[task].updatedAt": new Date(),
                        updatedAt: new Date()
                    } 
                },
                {
                    arrayFilters: [
                        { "section._id": sectionId },
                        { "task._id": taskId }
                    ]
                }
            )
            
            return result.modifiedCount > 0
        } catch (e) {
            console.error(`Unable to remove label from task: ${e}`)
            throw e
        }
    }
}