import mongodb from "mongodb"
const ObjectId = mongodb.ObjectId

let projects
export default class sectionDAO {
    static async injectDB(conn) {
        if (projects) {
            return
        }
        try {
            projects = await conn.db(process.env.MOVIEREVIEWS_DB_NAME).collection("projects")
        } catch (e) {
            console.error(`Unable to establish a collection handle in sectionDAO: ${e}`)
        }
    }
    
    static async addSection(projectId, name, description) {
        try {
            // First check if project exists
            const project = await projects.findOne({ _id: projectId })
            if (!project) {
                throw new Error("Project not found")
            }
            
            const sectionDoc = {
                _id: new ObjectId(), // Generate a unique ID for the section
                name: name,
                description: description,
                createdAt: new Date()
            }
            
            const result = await projects.updateOne(
                { _id: projectId },
                { $push: { sections: sectionDoc }, $set: { updatedAt: new Date() } }
            )
            
            return result.modifiedCount > 0 ? sectionDoc._id : null
        } catch (e) {
            console.error(`Unable to add section: ${e}`)
            throw e
        }
    }
    
    static async updateSection(projectId, sectionId, name, description) {
        try {
            const result = await projects.updateOne(
                { 
                    _id: projectId,
                    "sections._id": sectionId
                },
                { 
                    $set: { 
                        "sections.$.name": name,
                        "sections.$.description": description,
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
    
    static async deleteSection(projectId, sectionId) {
        try {
            const result = await projects.updateOne(
                { _id: projectId },
                { 
                    $pull: { sections: { _id: sectionId } },
                    $set: { updatedAt: new Date() }
                }
            )
            return result.modifiedCount > 0
        } catch (e) {
            console.error(`Unable to delete section: ${e}`)
            throw e
        }
    }
    
    static async getSectionById(projectId, sectionId) {
        try {
            const project = await projects.findOne(
                { 
                    _id: projectId,
                    "sections._id": sectionId
                },
                { projection: { "sections.$": 1 } }
            )
            
            return project && project.sections ? project.sections[0] : null
        } catch (e) {
            console.error(`Unable to get section: ${e}`)
            throw e
        }
    }
    
    static async getSectionsByProjectId(projectId) {
        try {
            const project = await projects.findOne(
                { _id: projectId },
                { projection: { sections: 1 } }
            )
            
            return project ? project.sections : []
        } catch (e) {
            console.error(`Unable to get sections by project ID: ${e}`)
            throw e
        }
    }
    
    static async getSections() {
        try {
            // This might not be efficient for large datasets
            // Consider a different approach if you have many projects
            const allProjects = await projects.find({}).toArray()
            const allSections = []
            
            allProjects.forEach(project => {
                if (project.sections && project.sections.length > 0) {
                    project.sections.forEach(section => {
                        // Add project info to each section
                        allSections.push({
                            ...section,
                            projectName: project.name,
                            projectId: project._id
                        })
                    })
                }
            })
            
            return allSections
        } catch (e) {
            console.error(`Unable to get all sections: ${e}`)
            throw e
        }
    }
}