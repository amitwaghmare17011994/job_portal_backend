const Job = require("../../db/Job");
const Application = require("../../db/Application");

const {
  getNonAppliedJob,
  getJobSearchQuery,
  generateQuery,
} = require("../../utils/job");

const getJobsController = async (req, res) => {
  try {
    const { user } = req;
    const posts = await Job.aggregate(generateQuery(getJobSearchQuery(req)));
    if (posts === null) {
      res.status(404).json({
        message: "No job found",
      });
      return;
    }
    const jobs = await getNonAppliedJob(user._id, posts);
    return res.json(jobs);
  } catch (err) {
    return res.status(400).json(err);
  }
};

const createJobController = async (req, res) => {
  try {
    const { user } = req;
    if (user.type != "recruiter") {
      res.status(401).json({
        message: "You don't have permissions to add jobs",
      });
      return;
    }
    const job = new Job({
      userId: user._id,
      ...req.body,
    });
    await job.save();
    return res.json({ message: "Job added successfully to the database" });
  } catch (error) {
    return res.status(400).json(error);
  }
};

const getJobByIdController = async (req, res) => {
  try {
    const {
      params: { id },
    } = req;
    const job = await Job.findOne({ _id: id });
    if (job === null) {
      return res.status(400).json({
        message: "Job does not exist",
      });
    }
    return res.json(job);
  } catch (error) {
    return res.status(400).json(error);
  }
};

const updateJobController = async (req, res) => {
  try {
    const {
      user,
      params: { id },
    } = req;
    if (user.type !== "recruiter") {
      return res.status(401).json({
        message: "You don't have permissions to change the job details",
      });
    }
    const job = await Job.findOne({ _id: id, userId: user.id });
    if (job == null) {
      res.status(404).json({
        message: "Job does not exist",
      });
      return;
    }
    const data = req.body;
    if (data.maxApplicants) {
      job.maxApplicants = data.maxApplicants;
    }
    if (data.maxPositions) {
      job.maxPositions = data.maxPositions;
    }
    if (data.deadline) {
      job.deadline = data.deadline;
    }
    await job.save();
    res.json({
      message: "Job details updated successfully",
    });
  } catch (error) {
    res.status(400).json(error);
  }
};

const deleteJobController = async (req, res) => {
  try {
    const { user } = req;
    if (user.type != "recruiter") {
      return res.status(401).json({
        message: "You don't have permissions to delete the job",
      });
    }
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      userId: user.id,
    });
    if (job === null) {
      return res.status(401).json({
        message: "You don't have permissions to delete the job",
      });
    }
    return res.json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    return res.status(400).json(err);
  }
};

const applyForJobController = (req, res) => {
  const user = req.user;
  if (user.type != "applicant") {
    res.status(401).json({
      message: "You don't have permissions to apply for a job",
    });
    return;
  }
  const data = req.body;
  const jobId = req.params.id;

  Job.findOne({ _id: jobId })
    .then((job) => {
      if (job === null) {
        res.status(404).json({
          message: "Job does not exist",
        });
        return;
      }
      Application.countDocuments({
        jobId: jobId,
        status: {
          $nin: ["rejected", "deleted", "cancelled", "finished"],
        },
      })
        .then((activeApplicationCount) => {
          if (activeApplicationCount < job.maxApplicants) {
            Application.countDocuments({
              userId: user._id,
              status: {
                $nin: ["rejected", "deleted", "cancelled", "finished"],
              },
            })
              .then((myActiveApplicationCount) => {
                if (myActiveApplicationCount < 10) {
                  Application.countDocuments({
                    userId: user._id,
                    status: "accepted",
                  }).then((acceptedJobs) => {
                    if (acceptedJobs === 0) {
                      const application = new Application({
                        userId: user._id,
                        recruiterId: job.userId,
                        jobId: job._id,
                        status: "applied",
                        sop: data.sop,
                      });
                      application
                        .save()
                        .then(() => {
                          res.json({
                            message: "Job application successful",
                          });
                        })
                        .catch((err) => {
                          res.status(400).json(err);
                        });
                    } else {
                      res.status(400).json({
                        message:
                          "You already have an accepted job. Hence you cannot apply.",
                      });
                    }
                  });
                } else {
                  res.status(400).json({
                    message:
                      "You have 10 active applications. Hence you cannot apply.",
                  });
                }
              })
              .catch((err) => {
                res.status(400).json(err);
              });
          } else {
            res.status(400).json({
              message: "Application limit reached",
            });
          }
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    })
    .catch((err) => {
      res.status(400).json(err);
    });
};

const getApplicationsForJobController = (req, res) => {
  const user = req.user;
  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to view job applications",
    });
    return;
  }
  const jobId = req.params.id;

  // const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  // const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  // const skip = page - 1 >= 0 ? (page - 1) * limit : 0;

  let findParams = {
    jobId: jobId,
    recruiterId: user._id,
  };

  let sortParams = {};

  if (req.query.status) {
    findParams = {
      ...findParams,
      status: req.query.status,
    };
  }

  Application.find(findParams)
    .collation({ locale: "en" })
    .sort(sortParams)
    // .skip(skip)
    // .limit(limit)
    .then((applications) => {
      res.json(applications);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
};

module.exports = {
  getJobsController,
  createJobController,
  getJobByIdController,
  updateJobController,
  deleteJobController,
  applyForJobController,
  getApplicationsForJobController,
};
