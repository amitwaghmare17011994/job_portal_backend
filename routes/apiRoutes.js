const express = require("express");
const jwtAuth = require("../lib/jwtAuth");

const {
  getJobsController,
  createJobController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
  applyForJobController,
  getApplicationsForJobController,
} = require("../controllers/job");
const {
  getUserController,
  getUserByIdController,
  updateUserController,
} = require("../controllers/user");
const {
  getApplicationsController,
  updateApplicationController,
} = require("../controllers/application");
const { getApplicantsController } = require("../controllers/applicant");
const {
  upsertRatingController,
  getRatingsController,
} = require("../controllers/rating");

const router = express.Router();

// To add new job
router.post("/jobs", jwtAuth, createJobController);

// to get all the jobs [pagination] [for recruiter personal and for everyone]
router.get("/jobs", jwtAuth, getJobsController);

// to get info about a particular job
router.get("/jobs/:id", jwtAuth, getJobByIdController);

// to update info of a particular job
router.put("/jobs/:id", jwtAuth, updateJobController);

// to delete a job
router.delete("/jobs/:id", jwtAuth, deleteJobController);

// get user's personal details
router.get("/user", jwtAuth, getUserController);

// get user details from id
router.get("/user/:id", jwtAuth, getUserByIdController);

// update user details
router.put("/user", jwtAuth, updateUserController);

// apply for a job [todo: test: done]
router.post("/jobs/:id/applications", applyForJobController);

// recruiter gets applications for a particular job [pagination] [todo: test: done]
router.get("/jobs/:id/applications", jwtAuth, getApplicationsForJobController);

// recruiter/applicant gets all his applications [pagination]
router.get("/applications", jwtAuth, getApplicationsController);

// update status of application: [Applicant: Can cancel, Recruiter: Can do everything] [todo: test: done]
router.put("/applications/:id", jwtAuth, updateApplicationController);

// get a list of final applicants for current job : recruiter
// get a list of final applicants for all his jobs : recuiter
router.get("/applicants", jwtAuth, getApplicantsController);

// to add or update a rating [todo: test]
router.put("/rating", jwtAuth, upsertRatingController);

// get personal rating
router.get("/rating", jwtAuth, getRatingsController);

module.exports = router;
