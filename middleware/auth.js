const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();

const auth = async (req, res, next) => {
    try {
        const authToken = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(authToken, process.env.PRIVATE_KEY);
        const user = await User.findOne({ where: { user_id: decoded.user_id }});
        
        // If the user was deleted or his token was deleted from the database
        if(!user ||
            user.tokens.filter((token) => token.token === authToken).length == 0){
            throw new Error("Unable to authenticate!");
        }

        req.token = authToken;
        req.user = user;
        next();
        
    } catch (e) {
        res.status(401).json({ error: "Unable to authenticate!" });
    }
}

module.exports = auth;