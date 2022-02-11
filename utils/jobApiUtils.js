const Application = require("../db/Application");

const isJobAlreadyApplied = async (userId, jobId) => {
  return new Promise((resolve, reject) => {
    Application.findOne({
      userId: userId,
      jobId: jobId,
      status: {
        $nin: ["deleted", "accepted", "cancelled"],
      },
    }).then((application) => {
      return resolve(application !== null);
    });
  });
};

const getNonAppliedJob = async (userId, jobs) => {
  return new Promise(async (resolve, reject) => {
    const nonAppliedJobs = [];
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const isAlereadyApplied = await isJobAlreadyApplied(userId, job._id);
      if (!isAlereadyApplied) {
        nonAppliedJobs.push(job);
      }
    }
    return resolve(nonAppliedJobs);
  });
};

module.exports = {
  getNonAppliedJob,
};
