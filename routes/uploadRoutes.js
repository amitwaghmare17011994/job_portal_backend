const express = require("express");
``
const router = express.Router();

router.post("/resume", (req, res) => {
    res.send({
        message: "Resume uploaded successfully",
        url: '',
    });

});

router.post("/profile", (req, res) => {
    res.send({
        message: "Profile image uploaded successfully",
        url: '',
    });
});

module.exports = router;