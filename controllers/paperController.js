const cloudinary = require('../utils/cloudinary');
const Paper = require('../models/paperModel');
const College=require('../models/collegeModel');
const Course=require('../models/courseModel');
const Department=require('../models/departmentModel');
const User=require('../models/userModel');
const Admin=require('../models/adminModel');
const sendResponse = require('../utils/response');
const fs = require('fs').promises;
const mongoose=require('mongoose');

exports.uploadPaper = async (req, res) => {
    try {
        const { paper_name, college, college_email, college_contact, course, department, semester, exam_type, year } = req.body;
        const file = req.file; 
        const userId=req.user._id;
        // Check if file is provided
        if (!file) {
            return sendResponse(res, 400, 'File is required',false, null);
        }

        // Upload file to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, { resource_type: 'auto',folder: 'pdfs' });
      
        // Delete the uploaded file from local storage after upload to Cloudinary
        await fs.unlink(file.path);
        // console.log('insidefunc');
        // Save metadata to the database
        const paper = new Paper({
            paper_name,
            paper_link: result.secure_url,
            college,
            college_email,
            college_contact,
            course,
            department,
            semester,
            exam_type,
            year,
            status_of_verification:0,
            is_valid:0,
            uploaded_by: req.user._id, // Assuming user is authenticated and req.user contains user information
            
        });

        const savedPaper = await paper.save();
        // console.log(savedPaper);
        await User.findByIdAndUpdate(userId, { $push: { papers: savedPaper._id } });

        return sendResponse(res, 201, 'Paper uploaded successfully',true, savedPaper);
    } catch (error) {
        // console.error(error);
        return sendResponse(res, 500, 'Failed', 'Internal server error', error.message);
    }
};

exports.getPapers = async (req, res) => {
    try {
        // Extract filter parameters from the request query
        let { college, department,course,semester, year, exam_type } = req.query;
        
        // Extract pagination parameters from the request query
        const page = parseInt(req.query.page) || 1; // Current page number
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page
        
        // Calculate the skip value to skip documents on previous pages
        const skip = (page - 1) * limit;

        let pipeline = [];
        let query = { status_of_verification: 2 };
        
        // Create a $match stage for each field and build the query object
        if (college) {
            const collegeArray = Array.isArray(college) ? college : [college];
            pipeline.push({ $match: { college: { $in: collegeArray } } });
            query.college = { $in: collegeArray };
        }
        
        if (department) {
            const departmentArray = Array.isArray(department) ? department : [department];
            pipeline.push({ $match: { department: { $in: departmentArray } } });
            query.department = { $in: departmentArray };
        }

        if(course){
            const courseArray=Array.isArray(course) ? course : [course];
            pipeline.push({$match:{course:{$in:courseArray}}});
            query.course={$in:courseArray};
        }
        
        if (year) {
            const yearArray = Array.isArray(year) ? year.map(Number) : [parseInt(year)];
            pipeline.push({ $match: { year: { $in: yearArray } } });
            query.year = { $in: yearArray };
        }
        
       if(semester){
        const semesterArray=Array.isArray(semester) ? semester.map(Number) : [parseInt(semester)];
        pipeline.push({$match:{ semester: { $in: semesterArray } }})
        query.semester={$in:semesterArray};
       }

        if (exam_type) {
            const examTypeArray = Array.isArray(exam_type) ? exam_type : [exam_type];
            pipeline.push({ $match: { exam_type: { $in: examTypeArray } } });
            query.exam_type = { $in: examTypeArray };
        }

        pipeline.push({$match:{status_of_verification:2}});
        
        // Use the query object to count documents
        const totalCount = (pipeline.length > 0) ? await Paper.countDocuments(query) : 0;

        // Apply the aggregation pipeline to fetch papers
        const papers = await Paper.aggregate(pipeline).skip(skip).limit(limit);
        

        // Calculate the total number of pages based on the total count and limit
        const totalPages = Math.ceil(totalCount / limit);
        
        // Return the paginated papers along with pagination metadata
        return sendResponse(res, 200, 'Papers found', true, { papers, totalPages, currentPage: page });

    } catch (error) {
        // console.error('Error fetching papers:', error);
        return sendResponse(res, 500, 'Internal server error', false, null);
    }
};

exports.deletePaperById=async(req,res)=>{
    try{
        const paperId = req.params.id;

        // Find and delete the paper by its ID
        const deletedPaper = await Paper.findByIdAndDelete(paperId);



        if (!deletedPaper) {
            return sendResponse(res, 404, 'Paper not found', false, null);
        }

        sendResponse(res, 200, 'Paper deleted successfully', true, deletedPaper);
    }
    catch(error){
        sendResponse(res, 500, 'Internal server error', false, null);
    }
}

exports.getColleges = async (req, res) => {
    try {
        const { search } = req.query;
     
        let colleges;
        if (search) {
            // Create a regular expression for case-insensitive search
            const searchRegex = new RegExp(`^${search}`, 'i');

            // Find colleges where name matches the search query
            colleges = await College.find({ name: { $regex: searchRegex } }, { name: 1, _id: 0 });
        } else {
            // Fetch all colleges if no search query is provided
            colleges = await College.find({}, { name: 1, _id: 0 });
        }

        // Extract college names
        colleges = colleges.map(college => college.name);

        // Send response back to client using sendResponse utility function
        sendResponse(res, 200, 'Found', true, colleges);
    } catch (error) {
        // console.error('Error fetching colleges:', error);
        return sendResponse(res, 500, 'Internal server error', false, null);
    }
};

exports.uploadCollege = async (req, res) => {
    try {
        const { name } = req.body;

        // Check if the college name is provided
        if (!name) {
            return sendResponse(res, 400, 'College name is required.', true, null);
        }

        // Create a new college instance
        const newCollege = new College({ name });

        // Save the college to the database
        await newCollege.save();

        return sendResponse(res, 200, 'College uploaded successfully!', true, newCollege);
    } catch (error) {
        if (error.code === 11000) {
            return sendResponse(res, 400, 'Duplicate college name found.', true, null);
        } else {
            return sendResponse(res, 500, 'Database operation failed.', true, null);
        }
    }
};

exports.uploadCourse=async(req,res)=>{
    try {
        const { name } = req.body;

        // Validate the input
        if (!name) {
            return sendResponse(res, 400, 'Course name is required', false);
        }

        // Create a new course
        const newCourse = new Course({ name });

        // Save the course to the database
        await newCourse.save();

        // Send response back to client
        sendResponse(res, 201, 'Course uploaded successfully', true, newCourse);
    } catch (error) {
        return sendResponse(res, 500, 'Internal server error', false, null);
    }
}

exports.getCourses=async(req,res)=>{
    try {
        // Fetch all courses from the Course collection
        let courses = await Course.find({}, { name: 1, _id: 0 });

        // Extract course names
        courses = courses.map(course => course.name);

        // Send response back to client using sendResponse utility function
        sendResponse(res, 200, 'Found', true, courses);
    } catch (error) {
        // console.error('Error fetching courses:', error);
        sendResponse(res, 500, 'Internal server error', false, null);
    }
}

exports.uploadDepartment=async(req,res)=>{
    try{
        const { name } = req.body;

        // Validate the input
        if (!name) {
            return sendResponse(res, 400, 'Department name is required', false);
        }

        // Create a new course
        const newDepartment = new Department({ name });

        // Save the course to the database
        await newDepartment.save();

        // Send response back to client
        sendResponse(res, 201, 'Department uploaded successfully', true, newDepartment);
    }
    catch(error){
        sendResponse(res, 500, 'Internal server error', false, null);
    }
}

exports.getDepartments=async(req,res)=>{
    try {
        // Fetch all courses from the Course collection
        let departments = await Department.find({}, { name: 1, _id: 0 });

        // Extract course names
        departments = departments.map(department => department.name);

        // Send response back to client using sendResponse utility function
        sendResponse(res, 200, 'Found', true, departments);
    } catch (error) {
        sendResponse(res, 500, 'Internal server error', false, null);
    }
}

exports.getMyPapers=async(req,res)=>{
    try{

         // Extract pagination parameters from the request query
         const page = parseInt(req.query.page) || 1; // Current page number
         const limit = parseInt(req.query.limit) || 10; // Number of documents per page
         
         // Calculate the skip value to skip documents on previous pages
         const skip = (page - 1) * limit;


        const userId = req.user._id; // Adjust this based on your authentication setup

        // Fetch papers associated with the current user
        // const papers = await Paper.find({uploaded_by:userId });

        const user = await User.findById(userId)
            .populate({
                path: 'papers',
                options: {
                    skip: parseInt(skip),
                    limit: parseInt(limit)
                }
            });

        const papers=user.papers;
        const totalCount = await Paper.countDocuments();
        

       // Calculate the total number of pages based on the total count and limit
       const totalPages = Math.ceil(totalCount / limit);
        
       // Return the paginated papers along with pagination metadata
       return sendResponse(res, 200, 'Papers found', true, { papers});
    }
    catch(error){
        sendResponse(res, 500, 'Internal server error', false, null);
    }
}


exports.getPaperById=async(req,res)=>{
    try{
        const paperId = req.params.id;
        const paper = await Paper.findById(paperId);

        if (!paper) {
            sendResponse(res,400,'Paper not found',false,null);
        }

        sendResponse(res,200,"Paper found",true,paper);

    }
    catch(error){
        sendResponse(res, 500, 'Internal server error', false, null);
    }
}

exports.updatePaper=async(req,res)=>{
    try {
        const paperId = req.params.id;
        const file = req.file; 

        // Check if file is provided
        if (!file) {
            return sendResponse(res, 400, 'File is required',false, null);
        }

        // Upload file to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, { resource_type: 'auto',folder: 'pdfs' });
      
        // Delete the uploaded file from local storage after upload to Cloudinary
        await fs.unlink(file.path);

        const {
            paper_name,
            college,
            college_email,
            college_contact,
            course,
            department,
            semester,
            exam_type,
            year
        } = req.body;
        const status_of_verification=0;
        const updatedFields = {
            paper_name,
            college,
            college_email,
            college_contact,
            course,
            department,
            semester,
            exam_type,
            year,
            status_of_verification
        };

        updatedFields.paper_link=result.secure_url;

        const updatedPaper = await Paper.findByIdAndUpdate(paperId, updatedFields, { new: true });

        if (!updatedPaper) {
            return sendResponse(res, 404, 'Paper not found', false, null);
        }

        sendResponse(res, 200, 'Paper updated successfully', true, updatedPaper);
    } catch (error) {
        sendResponse(res, 500, 'Internal server error', false, null);
    }
}

exports.getPendingPapers = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1; // Current page number
      const limit = parseInt(req.query.limit) || 10; // Number of documents per page
  
      // Calculate the skip value to skip documents on previous pages
      const skip = (page - 1) * limit;
  
      // Find pending papers with pagination
      const papers = await Paper.find({ status_of_verification: 0 })
        .skip(skip)
        .limit(limit);
  

      // Get the total count of pending papers
      const totalCount = await Paper.countDocuments({ status_of_verification: 0 });
  
      // Calculate the total number of pages based on the total count and limit
      const totalPages = Math.ceil(totalCount / limit);
  
      // Send the response with the pending papers and pagination info
      sendResponse(res, 200, "Pending papers fetched successfully", true, { papers, totalPages, currentPage: page });
    } catch (error) {
      sendResponse(res, 500, "Internal server error", false, null);
    }
  };
  

exports.getMyPendingVerificationPapers = async (req, res) => {
    try {
       
        const page = parseInt(req.query.page) || 1; // Current page number
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page
        const skip = (page - 1) * limit;

        const adminId = req.user._id;
        // console.log(adminId);


        // Find the admin by ID and populate the verification_pending_papers array
        let admin = await Admin.findById(adminId).populate({
            path: 'verification_pending_papers',
            options: {
                skip: skip,
                limit: limit
            }
        });

        // Extract the papers from the admin
        let papers = admin.verification_pending_papers;
        // console.log(papers);

        // Filter out any non-existent papers from verification_pending_papers array
        papers = await Promise.all(papers.map(async (paper) => {
            const paperExists = await Paper.exists({ _id: paper._id });
            return paperExists ? paper : null;
        }));

        // Remove any non-existent papers from verification_pending_papers array
        papers = papers.filter(paper => paper !== null);

        // Update the admin's verification_pending_papers array
        admin.verification_pending_papers = papers;
        await admin.save();

        // Count the total number of verification pending papers
        const totalCount = await Paper.countDocuments({ _id: { $in: admin.verification_pending_papers } });

        // Calculate the total number of pages based on the total count and limit
        const totalPages = Math.ceil(totalCount / limit);

        // Send the response with the synchronized pending papers and pagination info
        sendResponse(res, 200, "Pending papers fetched successfully", true, {
            papers,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        // Handle any errors that occur
        sendResponse(res, 500, 'Internal server error', false, error.message);
    }
};



exports.addPaperForVerification = async (req, res) => {
    try {
        // Extract admin ID from authenticated user
        const adminId = req.user._id;
      
        // Extract paper ID from request parameters
        const paperId = req.params.id;

        const paper = await Paper.findByIdAndUpdate(
            paperId,
            { $set: { status_of_verification: 1 } },
            { new: true }
        );
        
        // Find the admin by ID and update the verification_pending_papers array
        const admin = await Admin.findByIdAndUpdate(
            adminId,
            { $push: { verification_pending_papers: paperId } },
            { new: true }
        );

        // Send success response
        sendResponse(res, 200, 'Paper verification status updated and added to admin pending papers', true, admin.verification_pending_papers);

    } catch (error) {
        // Send error response
        sendResponse(res, 500, 'Internal server error', false, error.message);
    }
};

exports.removePaperFromMyPendingVerification=async(req,res)=>{
    try {
        // Extract admin ID from authenticated user
        const adminId = req.user._id;

        // Extract paper ID from request parameters
        const paperId = req.params.id;

        // Find and update the paper status_of_verification to 0
        const paper = await Paper.findByIdAndUpdate(
            paperId,
            { $set: { status_of_verification: 0 } },
            { new: true }
        );

        if (!paper) {
            return sendResponse(res, 404, 'Paper not found', false, null);
        }

        // Find the admin by ID and remove the paper from verification_pending_papers array
        const admin = await Admin.findByIdAndUpdate(
            adminId,
            { $pull: { verification_pending_papers: paperId } },
            { new: true }
        );

        if (!admin) {
            return sendResponse(res, 404, 'Admin not found', false, null);
        }

        // Send success response
        sendResponse(res, 200, 'Paper removed from verification pending papers and status updated', true, admin.verification_pending_papers);
    }
    catch(error){
        sendResponse(res, 500, 'Internal server error', false, error.message);
    }
}

exports.addToValidPaper=async(req,res)=>{
    try {
        // console.log('hi');
        const { id } = req.params;

        
        
        // Update the paper's status_of_verification to 1 (valid) using findByIdAndUpdate
        const paper = await Paper.findByIdAndUpdate(
            id,
            { status_of_verification: 2 ,
                verified_by: req.user._id
            },

            { new: true }
        );

        // console.log(paper);

        // Check if paper is found
        if (!paper) {
            return sendResponse(res, 404, 'Paper not found', false, null);
        }

        const adminId=req.user._id;

        // Find the admin by ID and remove the paper from verification_pending_papers array
        const admin = await Admin.findByIdAndUpdate(
            adminId,
            { $pull: { verification_pending_papers: id } },
            { new: true }
        );

        if (!admin) {
            return sendResponse(res, 404, 'Admin not found', false, null);
        }

        return sendResponse(res, 200, 'Paper added to valid papers', true, paper);
    } catch (error) {
        return sendResponse(res, 500, 'Internal server error', false, error.message);
    }
}

exports.invalidFromVerificationPending = async (req, res) => {
    try {
        const { id } = req.params;
         const adminId=req.user._id;
        // Find the admin by ID and remove the paper from verification_pending_papers array
        const admin = await Admin.findByIdAndUpdate(
            adminId,
            { $pull: { verification_pending_papers: id } },
            { new: true }
        );

        if (!admin) {
            return sendResponse(res, 404, 'Admin not found', false, null);
        }

        // Find the paper by ID and update status_of_verification and verified_by
        const paper = await Paper.findByIdAndUpdate(
            id,
            { 
                status_of_verification: -1,
                verified_by: req.user._id
            },
            { new: true }
        );

        if (!paper) {
            return sendResponse(res, 404, 'Paper not found', false, null);
        }

        return sendResponse(res, 200, 'Paper removed from verification pending and database', true, null);
    } catch (error) {
        return sendResponse(res, 500, 'Internal server error', false, error.message);
    }
};

exports.getMyVerifiedPapers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page number
        const limit = parseInt(req.query.limit) || 10; // Number of documents per page
        
        // Calculate the skip value to skip documents on previous pages
        const skip = (page - 1) * limit;

        const adminId = req.user._id;

        // Find the admin by ID
        const admin = await Admin.findById(adminId);

        if (!admin) {
            return sendResponse(res, 404, 'Admin not found', false, null);
        }

        // Get the admin's verified papers with pagination
        const papers = await Paper.find({ verified_by: adminId })
            .skip(skip)
            .limit(limit);

        // Count the total number of documents
        const totalCount = await Paper.countDocuments({ verified_by: adminId });

        // Calculate the total number of pages based on the total count and limit
        const totalPages = Math.ceil(totalCount / limit);

        // Send the response with the verified papers
        sendResponse(res, 200, 'Verified papers fetched successfully', true, {
            papers,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        return sendResponse(res, 500, 'Internal server error', false, error.message);
    }
};
