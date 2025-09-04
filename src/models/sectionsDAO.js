import mongodb from "mongodb"
const ObjectId = mongodb.ObjectId

let sections
let projects // We'll need access to projects collection for validation

export default class sectionDAO {
    static async injectDB(conn) {
        if (sections && projects) {
            return
        }
        try {
            sections = await conn.db(process.env.MOVIEREVIEWS_DB_NAME).collection("sections")
            projects = await conn.db(process.env.MOVIEREVIEWS_DB_NAME).collection("projects")
        } catch (e) {
            console.error(`Unable to establish collection handles in sectionDAO: ${e}`)
        }
    }
    
    static async addSection(projectId, name, description) {
        try {
            // First check if project exists
            const project = await projects.findOne({ _id: new ObjectId(projectId) })
            
            if (!project) {
                throw new Error("Project not found")
            }
            
            const sectionDoc = {
                _id: new ObjectId(),
                projectId: new ObjectId(projectId),
                name: name,
                description: description,
                createdAt: new Date(),
                updatedAt: new Date()
            }

            const result = await sections.insertOne(sectionDoc)

            return result.insertedId
        } catch (e) {
            console.error(`Unable to add section: ${e}`)
            throw e
        }
    }
    
    static async updateSection(sectionId, name, description) {
        try {
            const result = await sections.updateOne(
                { _id: new ObjectId(sectionId) },
                { 
                    $set: { 
                        name: name,
                        description: description,
                        updatedAt: new Date()
                    } 
                }
            )
            return result.modifiedCount > 0
        } catch (e) {
            console.error(`Unable to update section: ${e}`)
            throw e
        }
    }
    
    static async deleteSection(sectionId) {
        try {
            const result = await sections.deleteOne({ _id: new ObjectId(sectionId) })
            return result.deletedCount > 0
        } catch (e) {
            console.error(`Unable to delete section: ${e}`)
            throw e
        }
    }
    
    static async getSectionById(sectionId) {
        try {
            const section = await sections.findOne({ _id: new ObjectId(sectionId) })
            return section
        } catch (e) {
            console.error(`Unable to get section: ${e}`)
            throw e
        }
    }
    
    static async getSectionsByProjectId(projectId) {
        try {
            const sectionsList = await sections.find({ 
                projectId: new ObjectId(projectId) 
            }).toArray()
            
            return sectionsList
        } catch (e) {
            console.error(`Unable to get sections by project ID: ${e}`)
            throw e
        }
    }
    
    static async getSections() {
        try {
            // Use aggregation to join with projects collection
            const allSections = await sections.aggregate([
                {
                    $lookup: {
                        from: "projects",
                        localField: "projectId",
                        foreignField: "_id",
                        as: "project"
                    }
                },
                {
                    $unwind: "$project"
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        description: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        projectId: 1,
                        projectName: "$project.name"
                    }
                }
            ]).toArray()
            
            return allSections
        } catch (e) {
            console.error(`Unable to get all sections: ${e}`)
            throw e
        }
    }

    // Additional method to get sections with full project details
    static async getSectionsWithProjectDetails() {
        try {
            const sectionsWithProjects = await sections.aggregate([
                {
                    $lookup: {
                        from: "projects",
                        localField: "projectId",
                        foreignField: "_id",
                        as: "projectDetails"
                    }
                },
                {
                    $unwind: "$projectDetails"
                }
            ]).toArray()
            
            return sectionsWithProjects
        } catch (e) {
            console.error(`Unable to get sections with project details: ${e}`)
            throw e
        }
    }

    // Method to get sections count by project
    static async getSectionCountByProject(projectId) {
        try {
            const count = await sections.countDocuments({ 
                projectId: new ObjectId(projectId) 
            })
            return count
        } catch (e) {
            console.error(`Unable to get section count: ${e}`)
            throw e
        }
    }
}